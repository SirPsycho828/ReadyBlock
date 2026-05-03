import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Shield, Users, Heart, Zap } from 'lucide-react';

export default function About() {

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-20">
        <Link to="/auth/landing" className="mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Back to ReadyBlock
        </Link>

        {/* Hero */}
        <div className="mb-16">
          <div className="mb-6 flex items-center gap-3">
            <img src="/images/logo.png" alt="" className="h-14 w-auto drop-shadow-[0_4px_12px_rgba(0,0,0,0.1)]" aria-hidden="true" />
            <h1 className="text-3xl text-foreground sm:text-4xl" style={{ fontFamily: 'var(--font-display)' }}>
              About ReadyBlock
            </h1>
          </div>
          <p className="text-lg leading-relaxed text-muted-foreground">
            ReadyBlock is a neighborhood emergency preparedness platform built in Asheville, North Carolina. We help neighbors know each other, share resources, and coordinate when it matters most.
          </p>
        </div>

        {/* Story */}
        <section className="mb-16">
          <h2 className="mb-4 text-2xl text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
            Our Story
          </h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              In September 2024, Hurricane Helene devastated western North Carolina. Communities across Asheville and the surrounding region lost power, water, and communication for weeks. Roads were impassable. Cell towers were down. The infrastructure we all depend on simply stopped working.
            </p>
            <p>
              But something remarkable happened on every block: neighbors helped neighbors. People who had generators shared power. Those with chainsaws cleared roads. Medical professionals went door to door. Parents watched each other's children. The most effective emergency response wasn't organized by agencies — it was organized by people who knew who lived next door.
            </p>
            <p>
              The problem was that most of this coordination happened by accident. Neighbors who had lived on the same street for years didn't know what resources were nearby. Coordinators had no way to know who needed help first. Families had no quick way to tell loved ones they were safe.
            </p>
            <p>
              ReadyBlock was born from that experience. We asked a simple question: <em>What if every block knew — before disaster struck — who lived there, what they had, and what they needed?</em>
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="mb-16 rounded-2xl border border-teal-200 bg-teal-50 p-8">
          <h2 className="mb-4 text-2xl text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
            Our Mission
          </h2>
          <p className="text-lg leading-relaxed text-teal-700">
            To make every neighborhood block in America ready for emergencies — by connecting neighbors, mapping resources, and making sure no one is forgotten when it counts.
          </p>
        </section>

        {/* What we do */}
        <section className="mb-16">
          <h2 className="mb-8 text-2xl text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
            What ReadyBlock Does
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {[
              { icon: MapPin, title: 'Maps Your Block', desc: 'Every household on your street, visualized. See who has registered, what resources are available, and how prepared your neighborhood is.' },
              { icon: Users, title: 'Connects Neighbors', desc: 'Know your block coordinator. Know who has medical training. Know who has a generator. Before you need to.' },
              { icon: Shield, title: 'Emergency Check-Ins', desc: 'One tap sends a safety notification to your contacts during an emergency. Your block coordinator sees who is safe and who needs help.' },
              { icon: Zap, title: 'Works Offline', desc: 'When cell towers go down and internet fails, ReadyBlock keeps working. Your data is stored locally and syncs when connectivity returns.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl border border-teal-200 bg-teal-50/60 p-6">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
                  <Icon className="size-5" strokeWidth={1.5} />
                </div>
                <h3 className="mb-2 font-semibold text-foreground">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Values */}
        <section className="mb-16">
          <h2 className="mb-8 text-2xl text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
            Our Values
          </h2>
          <div className="space-y-6">
            {[
              { title: 'Privacy First', desc: 'You control who sees your information. Sensitive data like medical needs and mobility limitations are never shared without your explicit consent. We don\'t sell data. We don\'t serve ads. Your neighborhood information stays in your neighborhood.' },
              { title: 'Neighbors, Not Users', desc: 'ReadyBlock isn\'t a social network. It\'s not trying to maximize engagement or screen time. It\'s a tool that sits quietly on your phone 364 days a year and is there when you need it on the one day that matters.' },
              { title: 'Offline by Design', desc: 'Emergencies break infrastructure. A preparedness app that requires internet access during a disaster is useless. ReadyBlock works offline because that\'s when you need it most.' },
              { title: 'Community Over Individual', desc: 'Block readiness scores measure collective preparedness, not individual achievement. When one neighbor adds a generator, the whole block gets stronger. That\'s the point.' },
              { title: 'Built for Real Emergencies', desc: 'Every design decision, every feature, every word of copy is informed by what actually happened during Hurricane Helene. This isn\'t theoretical — it\'s built on lived experience.' },
            ].map(({ title, desc }) => (
              <div key={title} className="border-l-2 border-teal-300 pl-6">
                <h3 className="mb-1 font-semibold text-foreground">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Built in Asheville */}
        <section className="mb-16">
          <h2 className="mb-4 text-2xl text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
            Built in Asheville
          </h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              ReadyBlock is designed and built in Asheville, North Carolina — the city where we learned firsthand what community resilience looks like. Our initial focus is on Asheville and Buncombe County neighborhoods, with plans to expand to communities across western North Carolina and beyond.
            </p>
            <p>
              We work closely with local emergency management, neighborhood associations, and community organizations to ensure ReadyBlock reflects the actual needs of the neighborhoods it serves.
            </p>
          </div>
        </section>

        {/* Contact */}
        <section className="rounded-2xl border border-teal-200 bg-teal-50 p-8">
          <h2 className="mb-4 text-2xl text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
            Get in Touch
          </h2>
          <div className="space-y-3 text-muted-foreground">
            <p>We'd love to hear from you — whether you're a resident interested in using ReadyBlock, a coordinator looking to set up your neighborhood, or an organization interested in partnering with us.</p>
            <p><strong className="text-foreground">General inquiries:</strong> hello@readyblock.org</p>
            <p><strong className="text-foreground">Coordinator onboarding:</strong> coordinators@readyblock.org</p>
            <p><strong className="text-foreground">Press &amp; partnerships:</strong> press@readyblock.org</p>
            <p><strong className="text-foreground">Privacy questions:</strong> privacy@readyblock.org</p>
          </div>
        </section>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="mb-4 text-lg text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
            Ready to join your block?
          </p>
          <Link
            to="/auth/sign-up"
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-6 py-3 font-medium text-white hover:bg-amber-700"
          >
            Get Started — It Takes 2 Minutes
            <Heart className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
