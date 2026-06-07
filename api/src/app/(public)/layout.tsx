import Link from 'next/link';
import { PublicNav } from '@/components/public/PublicNav';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-white/5 backdrop-blur-md bg-darkbg/80">
        <div className="max-w-6xl mx-auto px-6 py-5 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center bg-white/5">
              <div className="w-4 h-4 rounded-full border border-mustard/60 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-mustard" />
              </div>
            </div>
            <span className="text-sm font-semibold tracking-wider text-offwhite uppercase">Album Studies</span>
          </Link>
          <PublicNav />
        </div>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="border-t border-white/5 mt-20">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="text-xs tracking-wider text-white/40 uppercase">Album Studies</span>
          <p className="text-[11px] text-white/30 tracking-wider">© 2026 Album Studies. All rights reserved.</p>
          <Link href="/admin/login" className="text-[11px] text-white/40 hover:text-mustard tracking-wider transition-colors">
            CMS Panel
          </Link>
        </div>
      </footer>
    </>
  );
}
