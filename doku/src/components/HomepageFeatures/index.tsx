import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  icon: string;
  description: JSX.Element;
  color: string;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Smart Templates',
    icon: '🧩',
    color: '#6366f1',
    description: (
      <>
        Write templates once, generate code for any database schema.
        Loops, conditionals, and JavaScript code blocks give you full control
        over the output.
      </>
    ),
  },
  {
    title: 'Visual Designers',
    icon: '🎨',
    color: '#ec4899',
    description: (
      <>
        Design forms and reports visually with drag-and-drop. Preview
        your layouts in real-time and generate production-ready UI code.
      </>
    ),
  },
  {
    title: 'Team Collaboration',
    icon: '👥',
    color: '#10b981',
    description: (
      <>
        Work together with role-based access, shared projects, built-in
        messaging, and Git integration. Keep your entire team in sync.
      </>
    ),
  },
];

function Feature({title, icon, description, color}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className={styles.featureCard}>
        <div className={styles.featureIcon} style={{color}}>
          {icon}
        </div>
        <div className="padding-horiz--md">
          <Heading as="h3" style={{color}}>{title}</Heading>
          <p>{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
