import { Link } from 'react-router-dom';
import { ArrowRight, Twitter, Github, Linkedin } from 'lucide-react';
import Logo from '../../assets/Logo.png';

export default function CTAFooter() {
  return (
    <>
      {/* CTA Banner */}
      <section className="py-24 bg-gradient-to-br from-emerald-600 to-teal-700 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">Start feeding your family better today</h2>
          <p className="text-lg text-emerald-100 mb-10 max-w-2xl mx-auto">
            Join 2,400+ families using NutriNest AI to take the guesswork out of healthy eating.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/signup"
              className="group inline-flex items-center gap-2 px-8 py-4 bg-white text-emerald-700 font-bold rounded-xl hover:bg-emerald-50 transition-all hover:-translate-y-0.5 shadow-xl"
            >
              Start Free — No Credit Card
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <img src={Logo} alt="NutriNest AI" className="h-8 w-8 rounded-lg object-cover" />
                <span className="font-bold text-white">NutriNest AI</span>
              </div>
              <p className="text-sm leading-relaxed mb-5">Family nutrition, planned in minutes.</p>
              <div className="flex gap-3">
                {[Twitter, Github, Linkedin].map((Icon, i) => (
                  <a key={i} href="#" className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors">
                    <Icon size={15} />
                  </a>
                ))}
              </div>
            </div>
            {[
              { heading: 'Product', links: ['Features', 'Pricing', 'Changelog', 'Roadmap'] },
              { heading: 'Resources', links: ['Documentation', 'Blog', 'Community', 'Support'] },
              { heading: 'Company', links: ['About', 'Careers', 'Privacy', 'Terms'] },
            ].map(col => (
              <div key={col.heading}>
                <h4 className="font-semibold text-white text-sm mb-4">{col.heading}</h4>
                <ul className="space-y-2">
                  {col.links.map(link => (
                    <li key={link}>
                      <a href="#" className="text-sm hover:text-white transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs">© 2026 NutriNest AI. All rights reserved.</p>
            <p className="text-xs">Made with care for families everywhere.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
