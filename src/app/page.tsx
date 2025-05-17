import Link from 'next/link';
import Image from 'next/image';
import styles from './landing.module.css';

export default function Home() {
  return (
    <div className={styles.landingPage}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Master Your <span className={styles.highlight}>Focus</span>,
            <br />
            Maximize Your <span className={styles.highlight}>Results</span>
          </h1>
          <p className={styles.heroSubtitle}>
            The simple yet powerful productivity tool that helps you stay
            focused, track your progress, and achieve more every day.
          </p>
          <div className={styles.heroCtas}>
            <Link href="/register" className={styles.primaryButton}>
              Get Started — It's Free
            </Link>
            <Link href="/login" className={styles.textLink}>
              Already have an account? Sign in →
            </Link>
          </div>
        </div>
        <div className={styles.heroImage}>
          <div className={styles.imageWrapper}>
            {/* Replace with your actual dashboard/app screenshot */}
            <Image
              src="/dashboard-preview.png"
              alt="Focus app dashboard"
              width={600}
              height={400}
              className={styles.dashboardImage}
              priority
            />
          </div>
        </div>
      </section>

      <section className={styles.benefits}>
        <h2 className={styles.sectionTitle}>Why Focus Works</h2>

        <div className={styles.benefitsGrid}>
          <div className={styles.benefitCard}>
            <div className={styles.benefitIcon}>⏱️</div>
            <h3>Scientifically-proven Method</h3>
            <p>
              Use the Pomodoro Technique and other evidence-based time
              management strategies to maximize your productivity.
            </p>
          </div>

          <div className={styles.benefitCard}>
            <div className={styles.benefitIcon}>📊</div>
            <h3>Visual Progress Tracking</h3>
            <p>
              Watch your productivity improve over time with detailed analytics
              and insights about your focus habits.
            </p>
          </div>

          <div className={styles.benefitCard}>
            <div className={styles.benefitIcon}>🎯</div>
            <h3>Goal-oriented Approach</h3>
            <p>
              Set clear objectives and track your progress toward completing
              them with our intuitive goal management system.
            </p>
          </div>

          <div className={styles.benefitCard}>
            <div className={styles.benefitIcon}>🧠</div>
            <h3>AI-powered Insights</h3>
            <p>
              Receive personalized recommendations and observations about your
              productivity patterns to help you improve.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.features}>
        <div className={styles.featureContent}>
          <h2 className={styles.sectionTitle}>Powerful Features</h2>
          <p className={styles.sectionSubtitle}>
            Everything you need to take control of your time and productivity
          </p>

          <div className={styles.featuresList}>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>✓</div>
              <div>
                <h3>Flexible Timer Options</h3>
                <p>
                  Choose between classic Pomodoro or free-running timers based
                  on your work style
                </p>
              </div>
            </div>

            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>✓</div>
              <div>
                <h3>Comprehensive Analytics</h3>
                <p>
                  Track your productivity trends with beautiful visualizations
                  and heatmaps
                </p>
              </div>
            </div>

            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>✓</div>
              <div>
                <h3>Task & Goal Management</h3>
                <p>
                  Organize your work with a built-in task system that integrates
                  with your focus sessions
                </p>
              </div>
            </div>

            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>✓</div>
              <div>
                <h3>Cross-platform Sync</h3>
                <p>
                  Access your focus data across all your devices with secure
                  cloud synchronization
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.featureShowcase}>
          <div className={styles.showcaseWrapper}>
            {/* Replace with feature showcase image */}
            <Image
              src="/features-showcase.png"
              alt="Focus app features"
              width={500}
              height={400}
              className={styles.showcaseImage}
            />
          </div>
        </div>
      </section>

      <section className={styles.testimonials}>
        <h2 className={styles.sectionTitle}>What Our Users Say</h2>

        <div className={styles.testimonialGrid}>
          <div className={styles.testimonialCard}>
            <p className={styles.testimonialText}>
              "Focus has transformed how I work. I'm getting more done in less
              time, and I can actually see my productivity improving week over
              week."
            </p>
            <div className={styles.testimonialAuthor}>
              <p className={styles.authorName}>Sarah K.</p>
              <p className={styles.authorTitle}>Software Developer</p>
            </div>
          </div>

          <div className={styles.testimonialCard}>
            <p className={styles.testimonialText}>
              "The analytics in this app are incredible. Being able to see when
              I'm most productive has helped me schedule my most important tasks
              at the right time."
            </p>
            <div className={styles.testimonialAuthor}>
              <p className={styles.authorName}>Michael T.</p>
              <p className={styles.authorTitle}>Marketing Manager</p>
            </div>
          </div>

          <div className={styles.testimonialCard}>
            <p className={styles.testimonialText}>
              "I've tried many productivity apps, but Focus strikes the perfect
              balance between simplicity and powerful features. It's now my
              go-to tool every day."
            </p>
            <div className={styles.testimonialAuthor}>
              <p className={styles.authorName}>Jessica W.</p>
              <p className={styles.authorTitle}>Freelance Writer</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.cta}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Ready to boost your productivity?</h2>
          <p className={styles.ctaText}>
            Join thousands of users who have transformed their work habits with
            Focus.
          </p>
          <div className={styles.ctaButtons}>
            <Link href="/register" className={styles.primaryButton}>
              Create Free Account
            </Link>
            <Link href="/timer" className={styles.secondaryButton}>
              Try Without Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
