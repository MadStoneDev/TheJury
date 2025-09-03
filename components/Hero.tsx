import { HeroButtons } from "@/components/HeroButtons"; // You'll replace this with your poll creation mockup

export const Hero = () => {
  return (
    <>
      <section className="flex flex-wrap ">
        <div className="flex items-center w-full">
          <div className="w-full max-w-xl mb-8">
            <h1 className="text-4xl font-bold leading-snug tracking-tight text-neutral-800 lg:text-4xl lg:leading-tight xl:text-6xl xl:leading-tight dark:text-white">
              Create polls easy and squeezy
            </h1>
            <p className="py-5 text-xl leading-normal text-neutral-400 lg:text-xl xl:text-2xl dark:text-neutral-500">
              Create polls quickly and easily.
            </p>

            <HeroButtons />
          </div>
        </div>
      </section>
    </>
  );
};
