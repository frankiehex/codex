import { tools } from "./tools/index.js"

async function main() {
  console.log("Franklin MCP server bootstrap")
  console.log("Available tools:", Object.keys(tools))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
