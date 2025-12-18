import { useTranslation } from 'react-i18next';

import blog1 from '/landing/blog1.png';
import blog2 from '/landing/blog2.png';
import blog3 from '/landing/blog3.png';
import blog4 from '/landing/blog4.png';

interface BlogCard {
  id: string;
  image: string;
}

const BLOG_IDS: BlogCard[] = [
  {
    id: 'digital-community-pillars',
    image: blog1,
  },
  {
    id: 'digital-belonging',
    image: blog2,
  },
  {
    id: 'measure-connection',
    image: blog3,
  },
  {
    id: 'moderation-right-way',
    image: blog4,
  },
];

export function LandingBlogsV2() {
  const { t } = useTranslation('landing');

  return (
    <section className="bg-[#fff6e6] pb-24 pt-20 sm:pb-8 sm:pt-24">
      <div className="mx-auto w-[90vw]">
        <div className="mb-10 text-center">
          <div className="mb-3 flex items-center justify-center gap-2 text-md font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FF7A1A]" />
            <span>{t('blogsV2.badge')}</span>
          </div>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t('blogsV2.title')}
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          {BLOG_IDS.map((blog) => (
            <article
              key={blog.id}
              className="flex flex-col text-left"
            >
              <div className="overflow-hidden rounded-3xl bg-muted">
                <img
                  src={blog.image}
                  alt={t(`blogsV2.blogs.${blog.id}.title`)}
                  className="h-44 w-full object-cover transition-transform duration-300 hover:scale-105 md:h-48"
                />
              </div>
              <h3 className="mt-4 text-sm font-semibold leading-snug text-foreground sm:text-base">
                {t(`blogsV2.blogs.${blog.id}.title`)}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {t(`blogsV2.blogs.${blog.id}.subtitle`)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}


