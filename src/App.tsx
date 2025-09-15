import { TableEditor } from "@/components/table-editor"

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">React Table Editor & Transformer</h1>
        <TableEditor />
      </div>
    </main>
  )
}
