#pragma once

#include "esphome.h"
#include <WiFiClientSecure.h>
#include <PubSubClient.h>

extern "C" {
#include "mbedtls/md.h"
#include "mbedtls/base64.h"
}

#define FIRMWARE_VERSION "1.0.0"

// Global pointer for access from ESPHome lambdas
class AwsIotMqttComponent;
AwsIotMqttComponent *global_aws_mqtt = nullptr;

class AwsIotMqttComponent : public Component {
 public:
  // ===== Configuration (set from YAML lambda) =====
  std::string host;
  uint16_t port = 443;
  std::string tenant_id;
  std::string secret_key;
  std::string nonce;
  std::string auth_name;
  std::string client_id;

  // Topics to subscribe
  std::vector<std::string> sub_topics;

  // Text sensors for displaying received messages (matched by index with sub_topics)
  std::vector<esphome::text_sensor::TextSensor *> topic_sensors;
  esphome::text_sensor::TextSensor *status_sensor = nullptr;

  // ===== Monitoring stats (exposed via getters for YAML sensors) =====
  uint32_t reconnect_count_ = 0;
  uint32_t total_messages_ = 0;
  unsigned long longest_conn_ms_ = 0;
  unsigned long shortest_conn_ms_ = ULONG_MAX;
  unsigned long conn_start_ms_ = 0;  // millis() when current connection started

  // ===== Internal state =====
  WiFiClientSecure wifi_client_;
  PubSubClient *mqtt_client_ = nullptr;
  bool connected_ = false;
  unsigned long last_reconnect_ = 0;
  unsigned long reconnect_interval_ = 10000;  // 10s between reconnect attempts
  bool time_synced_ = false;

  float get_setup_priority() const override {
    return setup_priority::AFTER_WIFI;
  }

  // Set global pointer early so template sensors can access stats
  // even before setup() runs
  AwsIotMqttComponent() { global_aws_mqtt = this; }

  void setup() override {

    // TLS with ALPN "mqtt" for AWS IoT port 443
    static const char *alpn_protos[] = {"mqtt", nullptr};
    wifi_client_.setAlpnProtocols(alpn_protos);
    wifi_client_.setInsecure();  // Skip cert verification for now

    mqtt_client_ = new PubSubClient(wifi_client_);
    mqtt_client_->setServer(host.c_str(), port);
    mqtt_client_->setBufferSize(1024);
    mqtt_client_->setKeepAlive(60);
    mqtt_client_->setCallback(
        [this](char *topic, byte *payload, unsigned int length) {
          on_message_(topic, payload, length);
        });

    // NTP time sync (UTC)
    configTime(0, 0, "pool.ntp.org", "time.nist.gov");
    ESP_LOGI("aws_mqtt", "Setup done. Host: %s:%d, FW: %s", host.c_str(), port, FIRMWARE_VERSION);
    update_status_("Waiting for NTP...");
  }

  void loop() override {
    if (WiFi.status() != WL_CONNECTED) return;

    // Check NTP sync
    if (!time_synced_) {
      time_t now_t = ::time(nullptr);
      if (now_t > 1700000000) {
        time_synced_ = true;
        ESP_LOGI("aws_mqtt", "NTP synced! time=%ld", (long)now_t);
        update_status_("NTP synced, connecting...");
      } else {
        return;  // Wait for NTP
      }
    }

    if (!mqtt_client_->connected()) {
      if (connected_) {
        // Just disconnected — record session duration
        unsigned long session_ms = millis() - conn_start_ms_;
        if (session_ms > longest_conn_ms_) longest_conn_ms_ = session_ms;
        if (session_ms < shortest_conn_ms_) shortest_conn_ms_ = session_ms;
        connected_ = false;
        update_status_("Disconnected");
        ESP_LOGW("aws_mqtt", "MQTT disconnected (session was %lu s)", session_ms / 1000);
      }
      unsigned long now = millis();
      if (now - last_reconnect_ > reconnect_interval_) {
        last_reconnect_ = now;
        do_connect_();
      }
    } else {
      if (!connected_) {
        connected_ = true;
        conn_start_ms_ = millis();
        update_status_("Connected");
      }
      mqtt_client_->loop();
    }
  }

  // ===== Public API =====
  bool is_connected() { return connected_; }
  const char *get_version() { return FIRMWARE_VERSION; }
  uint32_t get_reconnect_count() { return reconnect_count_; }
  uint32_t get_total_messages() { return total_messages_; }

  // Current connection duration in seconds (0 if not connected)
  unsigned long get_current_conn_secs() {
    if (!connected_) return 0;
    return (millis() - conn_start_ms_) / 1000;
  }

  // Longest connection duration in seconds
  unsigned long get_longest_conn_secs() {
    // Also consider current ongoing session
    unsigned long current = 0;
    if (connected_) {
      current = millis() - conn_start_ms_;
    }
    unsigned long best = longest_conn_ms_;
    if (current > best) best = current;
    return best / 1000;
  }

  // Shortest connection duration in seconds
  unsigned long get_shortest_conn_secs() {
    if (shortest_conn_ms_ == ULONG_MAX) return 0;  // No completed sessions yet
    return shortest_conn_ms_ / 1000;
  }

  // Get current time as formatted string (UTC+8 Taipei)
  std::string get_current_time_str() {
    time_t now_t = ::time(nullptr);
    if (now_t < 1700000000) return "NTP not synced";
    now_t += 8 * 3600;  // UTC+8
    struct tm *tm_info = gmtime(&now_t);
    char buf[32];
    strftime(buf, sizeof(buf), "%Y-%m-%d %H:%M:%S", tm_info);
    return std::string(buf);
  }

  // Get uptime as human-readable string
  std::string get_uptime_str() {
    unsigned long secs = millis() / 1000;
    unsigned long days = secs / 86400;
    secs %= 86400;
    unsigned long hours = secs / 3600;
    secs %= 3600;
    unsigned long mins = secs / 60;
    secs %= 60;
    char buf[64];
    if (days > 0) {
      snprintf(buf, sizeof(buf), "%lud %luh %lum %lus", days, hours, mins, secs);
    } else if (hours > 0) {
      snprintf(buf, sizeof(buf), "%luh %lum %lus", hours, mins, secs);
    } else {
      snprintf(buf, sizeof(buf), "%lum %lus", mins, secs);
    }
    return std::string(buf);
  }

  // ===== System Resource Getters =====
  uint32_t get_cpu_freq_mhz() { return ESP.getCpuFreqMHz(); }
  uint32_t get_free_heap() { return ESP.getFreeHeap(); }
  uint32_t get_total_heap() { return ESP.getHeapSize(); }
  uint32_t get_min_free_heap() { return ESP.getMinFreeHeap(); }
  float get_heap_usage_pct() {
    uint32_t total = ESP.getHeapSize();
    if (total == 0) return 0;
    return 100.0f * (1.0f - (float)ESP.getFreeHeap() / (float)total);
  }

  // Subscribed topics list (formatted string for display)
  std::string get_subscribed_topics_str() {
    std::string result;
    for (size_t i = 0; i < sub_topics.size(); i++) {
      if (i > 0) result += " | ";
      result += std::to_string(i + 1) + ". " + sub_topics[i];
    }
    return result.empty() ? "No topics" : result;
  }

  void publish(const std::string &topic, const std::string &payload) {
    if (mqtt_client_ && mqtt_client_->connected()) {
      mqtt_client_->publish(topic.c_str(), payload.c_str());
      ESP_LOGI("aws_mqtt", "Published to %s: %s", topic.c_str(),
               payload.c_str());
    } else {
      ESP_LOGW("aws_mqtt", "Cannot publish - not connected");
    }
  }

 private:
  void do_connect_() {
    reconnect_count_++;

    // Generate dynamic HMAC credentials
    std::string username, password;
    gen_credentials_(username, password);

    ESP_LOGI("aws_mqtt", "Connecting to AWS IoT as '%s'... (attempt #%u)",
             client_id.c_str(), reconnect_count_);

    if (mqtt_client_->connect(client_id.c_str(), username.c_str(),
                               password.c_str())) {
      ESP_LOGI("aws_mqtt", "Connected to AWS IoT!");
      for (auto &topic : sub_topics) {
        mqtt_client_->subscribe(topic.c_str());
        ESP_LOGI("aws_mqtt", "Subscribed: %s", topic.c_str());
      }
    } else {
      int rc = mqtt_client_->state();
      ESP_LOGW("aws_mqtt", "Connect failed, rc=%d", rc);
      update_status_("Connect failed (rc=" + std::to_string(rc) + ")");
    }
  }

  void gen_credentials_(std::string &username, std::string &password) {
    time_t now_t = ::time(nullptr);
    std::string ts_str = std::to_string((long)now_t);
    std::string username_base =
        tenant_id + "-" + ts_str + "-" + nonce;
    username =
        username_base + "?x-amz-customauthorizer-name=" + auth_name;

    // HMAC-SHA256(secret_key, username_base)
    uint8_t hmac_out[32];
    mbedtls_md_context_t ctx;
    mbedtls_md_init(&ctx);
    mbedtls_md_setup(&ctx, mbedtls_md_info_from_type(MBEDTLS_MD_SHA256), 1);
    mbedtls_md_hmac_starts(&ctx, (const uint8_t *)secret_key.c_str(),
                           secret_key.length());
    mbedtls_md_hmac_update(&ctx, (const uint8_t *)username_base.c_str(),
                           username_base.length());
    mbedtls_md_hmac_finish(&ctx, hmac_out);
    mbedtls_md_free(&ctx);

    // Base64 encode
    unsigned char b64[64];
    size_t olen = 0;
    mbedtls_base64_encode(b64, sizeof(b64), &olen, hmac_out, 32);
    password = std::string((char *)b64, olen);

    ESP_LOGD("aws_mqtt", "Generated creds - ts=%s, user_base=%s",
             ts_str.c_str(), username_base.c_str());
  }

  void on_message_(char *topic, byte *payload, unsigned int length) {
    std::string msg((char *)payload, length);
    std::string topic_str(topic);
    total_messages_++;
    ESP_LOGI("aws_mqtt", "Received [%s]: %s (total: %u)", topic, msg.c_str(), total_messages_);

    // Match topic to sensor
    for (size_t i = 0; i < sub_topics.size() && i < topic_sensors.size();
         i++) {
      if (topic_str == sub_topics[i] && topic_sensors[i]) {
        topic_sensors[i]->publish_state(msg);
        break;
      }
    }
  }

  void update_status_(const std::string &status) {
    if (status_sensor) {
      status_sensor->publish_state(status);
    }
  }
};
