'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  PlusCircle,
  LogOut,
  Wrench,
  ChevronRight,
  BookUser,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/cases/new', icon: PlusCircle, label: 'New Case' },
  { href: '/contacts', icon: BookUser, label: 'Contacts' },
]

export default function Sidebar() {
  const path = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-60 flex flex-col bg-brand-navy text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-lg bg-brand-teal flex items-center justify-center flex-shrink-0">
          <Wrench size={18} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight tracking-wide">MOTOWAREHOUSE</p>
          <p className="text-[10px] text-brand-teal-pale font-light tracking-widest uppercase">
            Insurance Cases
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = href === '/' ? path === '/' : path.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                active
                  ? 'bg-brand-teal text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/8'
              )}
            >
              <Icon size={16} />
              <span>{label}</span>
              {active && <ChevronRight size={14} className="ml-auto opacity-60" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="mb-2 px-3 py-2">
          <p className="text-[11px] text-white/40 font-light">support@motowarehouse.com.cy</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/50
                     hover:text-white hover:bg-white/8 transition-all w-full"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
