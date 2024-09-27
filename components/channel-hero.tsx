import { format } from "date-fns";
import React from "react";

interface ChannellHeroProps {
  name: string;
  creationTime: number;
}

export const ChannelHero = ({ name, creationTime }: ChannellHeroProps) => {
  return (
    <div className="mt-[88px] mx-5 mb-4">
      <p className="text-2xl font-bold flex items-center mb-2"># {name}</p>
      <p className="text-base text-slate-700 mb-4">
        This channel was created on {format(creationTime, "MMMM do, yyyy")}.
        Welcome to the <strong>{name}</strong> channel – the very beginning of
        something great!
      </p>
    </div>
  );
};
