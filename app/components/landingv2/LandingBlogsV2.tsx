import { useTranslation } from 'react-i18next';

interface BlogCard {
  id: string;
  image: string;
}

const BLOG_IDS: BlogCard[] = [
  {
    id: 'digital-community-pillars',
    image: '/landing/blog1.png',
  },
  {
    id: 'digital-belonging',
    image: '/landing/blog2.png',
  },
  {
    id: 'measure-connection',
    image: '/landing/blog3.png',
  },
  {
    id: 'moderation-right-way',
    image: '/landing/blog4.png',
  },
];

export function LandingBlogsV2() {
  const { t } = useTranslation('landing');

  return (
    <section className="bg-[#F6F4F1] py-15">
      <div className="mx-auto w-[90vw] 2xl:w-[90rem]">
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
              <h3 className="mt-4 text-[1.5rem] md:text-[1.875rem] font-semibold leading-snug text-foreground sm:text-base">
                {t(`blogsV2.blogs.${blog.id}.title`)}
              </h3>
              <p className="mt-2 text-[0.875rem] leading-relaxed text-muted-foreground sm:text-sm">
                {t(`blogsV2.blogs.${blog.id}.subtitle`).length > 100 ? t(`blogsV2.blogs.${blog.id}.subtitle`).substring(0, 100) + '...' : t(`blogsV2.blogs.${blog.id}.subtitle`)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}


