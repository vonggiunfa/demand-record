import SalesReportTable from '@/components/SalesReportTable'
import ScrollToTopButton from '@/components/ScrollToTopButton'
import { Toaster } from 'sonner'

export default function Home() {
  return (
    <div className="container mx-auto py-6 px-4 md:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-center">品福均创 - 销售数据报表系统</h1>
        <p className="text-center text-muted-foreground mt-2">
          记录销售数据，分析经营趋势，助力业务增长
        </p>
      </header>
      
      <div className="bg-white rounded-lg shadow-md">
        <SalesReportTable />
      </div>
      
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} 品福均创 - 版权所有</p>
      </footer>
      
      <ScrollToTopButton />
      <Toaster position="top-right" richColors />
    </div>
  )
}

