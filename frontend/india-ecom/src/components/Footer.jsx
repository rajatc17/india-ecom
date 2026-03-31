import { Link } from 'react-router'
import { FaFacebookF, FaInstagram, FaLocationDot, FaPhone, FaXTwitter } from 'react-icons/fa6'
import { MdEmail } from 'react-icons/md'

const quickLinks = [
  { label: 'Home', to: '/' },
  { label: 'Search Products', to: '/search' },
  { label: 'My Account', to: '/account' },
  { label: 'My Cart', to: '/cart' }
]

const popularSearches = [
  { label: 'Banarasi Saree', to: '/search?query=banarasi' },
  { label: 'Brass Handicrafts', to: '/search?query=brass' },
  { label: 'Madhubani Art', to: '/search?query=madhubani' },
  { label: 'Ayurveda Wellness', to: '/search?query=ayurveda' }
]

const Footer = () => {
  const year = new Date().getFullYear()

  return (
    <footer className='relative mt-14 overflow-hidden bg-[#2b1a10] text-[#fff5e8]'>
      <div className='pointer-events-none absolute -top-24 -left-20 h-72 w-72 rounded-full bg-amber-600/20 blur-3xl' />
      <div className='pointer-events-none absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl' />

      <div className='relative mx-auto max-w-7xl px-4 py-6 sm:px-8'>
        <div className='mb-8 grid grid-cols-1 gap-3 rounded-2xl border border-amber-100/15 bg-white/5 p-4 text-sm sm:grid-cols-3'>
          <div className='rounded-lg bg-white/5 px-4 py-3 text-center tracking-wide'>100% Authentic Indian Artisanship</div>
          <div className='rounded-lg bg-white/5 px-4 py-3 text-center tracking-wide'>Pan-India Delivery With Secure Packaging</div>
          <div className='rounded-lg bg-white/5 px-4 py-3 text-center tracking-wide'>Trusted Payments And Easy Support</div>
        </div>

        <div className='grid grid-cols-1 gap-10 pb-8 sm:grid-cols-2 lg:grid-cols-4'>
          <div>
            <h3 className='shilpika-heading text-3xl font-semibold text-amber-200'>Shilpika</h3>
            <p className='mt-4 text-sm leading-6 text-amber-50/85'>
              Curated collections inspired by India&apos;s timeless crafts. From handloom classics to regional treasures,
              every purchase supports authentic makers.
            </p>
            <div className='mt-5 flex items-center gap-3'>
              <a className='rounded-full border border-amber-100/35 p-2.5 transition hover:-translate-y-0.5 hover:bg-amber-100/15' href='https://www.instagram.com' target='_blank' rel='noreferrer' aria-label='Instagram'>
                <FaInstagram size={16} />
              </a>
              <a className='rounded-full border border-amber-100/35 p-2.5 transition hover:-translate-y-0.5 hover:bg-amber-100/15' href='https://www.facebook.com' target='_blank' rel='noreferrer' aria-label='Facebook'>
                <FaFacebookF size={16} />
              </a>
              <a className='rounded-full border border-amber-100/35 p-2.5 transition hover:-translate-y-0.5 hover:bg-amber-100/15' href='https://x.com' target='_blank' rel='noreferrer' aria-label='X'>
                <FaXTwitter size={16} />
              </a>
            </div>
          </div>

          <div>
            <h4 className='text-lg font-semibold text-amber-100'>Quick Links</h4>
            <ul className='mt-4 space-y-3 text-sm'>
              {quickLinks.map((item) => (
                <li key={item.label}>
                  <Link className='text-amber-50/85 transition hover:pl-1 hover:text-white' to={item.to}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className='text-lg font-semibold text-amber-100'>Popular In India</h4>
            <ul className='mt-4 space-y-3 text-sm'>
              {popularSearches.map((item) => (
                <li key={item.label}>
                  <Link className='text-amber-50/85 transition hover:pl-1 hover:text-white' to={item.to}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className='text-lg font-semibold text-amber-100'>Contact & Updates</h4>
            <ul className='mt-4 space-y-3 text-sm text-amber-50/85'>
              <li className='flex items-start gap-2'>
                <FaLocationDot className='mt-1 text-amber-300' size={14} />
                24 Craft Bazaar Lane, Jaipur, Rajasthan
              </li>
              <li className='flex items-center gap-2'>
                <FaPhone className='text-amber-300' size={14} />
                +91 98XXXXXX10
              </li>
              <li className='flex items-center gap-2'>
                <MdEmail className='text-amber-300' size={16} />
                support@shilpika.in
              </li>
            </ul>

            <form className='mt-5 flex gap-2' onSubmit={(e) => e.preventDefault()}>
              <input
                type='email'
                placeholder='Your email'
                className='w-full rounded-md border border-amber-200/30 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-amber-50/60 focus:border-amber-300 focus:outline-none'
              />
              <button
                type='submit'
                className='rounded-md bg-amber-500 px-3 py-2 text-sm font-semibold text-[#2b1a10] transition hover:bg-amber-400'
              >
                Join
              </button>
            </form>
          </div>
        </div>

        <div className='flex flex-col gap-3 border-t border-amber-100/20 pt-5 text-xs text-amber-50/70 sm:flex-row sm:items-center sm:justify-between'>
          <p>Copyright {year} Shilpika. Celebrating the spirit of India&apos;s handmade excellence.</p>
          <div className='flex flex-wrap items-center gap-4'>
            <button type='button' className='transition hover:text-white'>Privacy Policy</button>
            <button type='button' className='transition hover:text-white'>Shipping & Returns</button>
            <button type='button' className='transition hover:text-white'>Terms of Service</button>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer