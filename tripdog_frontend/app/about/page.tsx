import React from 'react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">关于我们</h1>
          
          <div className="prose prose-lg text-gray-600">
            <p className="mb-4">
              这是一个使用Next.js App Router创建的示例页面。在Next.js中创建新页面非常简单：
            </p>
            
            <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">创建步骤</h2>
            <ol className="list-decimal pl-5 space-y-2 mb-6">
              <li>在<code className="bg-gray-100 px-2 py-1 rounded">app</code>目录下创建新文件夹</li>
              <li>在文件夹中创建<code className="bg-gray-100 px-2 py-1 rounded">page.tsx</code>文件</li>
              <li>导出一个默认的React组件</li>
            </ol>
            
            <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">示例代码</h2>
            <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto mb-6">
              {`// app/new-page/page.tsx
import React from 'react';

export default function NewPage() {
  return (
    <div>
      <h1>我的新页面</h1>
      <p>这是新创建的页面内容</p>
    </div>
  );
}`}
            </pre>
            
            <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">路由说明</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>文件路径：<code className="bg-gray-100 px-2 py-1 rounded">app/about/page.tsx</code></li>
              <li>访问路径：<code className="bg-gray-100 px-2 py-1 rounded">/about</code></li>
              <li>特殊路径：
                <ul className="list-circle pl-5 mt-2">
                  <li><code className="bg-gray-100 px-2 py-1 rounded">app/page.tsx</code> → <code className="bg-gray-100 px-2 py-1 rounded">/</code> (首页)</li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">app/blog/[id]/page.tsx</code> → 动态路由 <code className="bg-gray-100 px-2 py-1 rounded">/blog/1</code></li>
                </ul>
              </li>
            </ul>
          </div>
          
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">提示</h3>
            <p className="text-blue-700">
              在Next.js 13+中推荐使用App Router（app目录）而不是Pages Router（pages目录）来创建页面。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}