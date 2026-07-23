import { PageHeader } from '@/components/ui/data-table'

export default function SystemSettingsPage() {
  return (
    <div className="pb-20">
      <PageHeader
        title="System Settings"
        description="Global platform configurations and limits."
      />
      
      <div className="mt-8 flex h-96 items-center justify-center rounded-2xl border border-dashed border-[hsl(214,32%,91%)] bg-white dark:border-white/10 dark:bg-[hsl(217,33%,17%)]">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-[hsl(222,47%,11%)] dark:text-white">Coming Soon</h3>
          <p className="mt-2 text-sm text-[hsl(215,16%,47%)]">Global system settings are currently under development.</p>
        </div>
      </div>
    </div>
  )
}
