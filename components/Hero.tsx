import { HeroButtons } from "@/components/HeroButtons";
import Image from "next/image";

export const Hero = () => {
  return (
    <>
      <section className="flex flex-col-reverse lg:flex-row flex-wrap lg:flex-nowrap items-end gap-8 pb-16">
        <div className="flex w-full lg:w-1/2 ">
          <div className="flex flex-col items-start md:items-center lg:items-start w-full max-w-xl mb-8">
            <h1 className="text-4xl font-bold leading-snug tracking-tight text-neutral-800 lg:text-4xl lg:leading-tight xl:text-6xl xl:leading-tight dark:text-white">
              Create polls easy and squeezy
            </h1>
            <p className="py-5 text-xl leading-normal text-neutral-400 lg:text-xl xl:text-2xl dark:text-neutral-500">
              Create polls quickly and easily.
            </p>

            <HeroButtons />
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
          <Image
            src="/Knight-on-Laptop.png"
            alt="Knight working on laptop - Create polls with TheJury"
            width={800}
            height={800}
            className="w-full max-w-[300px] md:max-w-[500px] lg:max-w-[600px] aspect-square"
            priority
          />
        </div>
      </section>
    </>
  );
};
