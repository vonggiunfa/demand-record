import DemandRecordTable from '@/components/DemandRecordTable';

export default function Home() {
  return (
    <div className="container mx-auto py-6 px-4 md:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-center">需求记录表</h1>
        <p className="text-center text-muted-foreground mt-2">
          记录需求，助力业务增长
        </p>
      </header>
      
      <div className="max-w-[55vw] mx-auto mt-10">
        <DemandRecordTable />
      </div>
    </div>
  )
}

