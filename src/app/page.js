import HtmlToImageTool from './components/HtmlToImageTool/page';

export default function Home() {
  return (
    <main className="min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">HTML画像生成ツール</h1>
      <HtmlToImageTool />
    </main>
  )
}