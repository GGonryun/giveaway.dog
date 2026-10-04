import {
  GiveawayDesignBackgroundSchema,
  GradientBackgroundSchema
} from './schemas';

export const toGradient = (gradient: GradientBackgroundSchema) => {
  const stops = gradient.stops
    .map((stop) => `${stop.color} ${stop.position}%`)
    .join(', ');
  if (gradient.format === 'linear') {
    return `linear-gradient(${gradient.angle}deg, ${stops})`;
  } else {
    return `radial-gradient(circle, ${stops})`;
  }
};

export const toBackgroundStyle = (
  background: GiveawayDesignBackgroundSchema
) => {
  switch (background.type) {
    case 'color':
      return background.color;
    case 'gradient':
      return toGradient(background);
    default:
      return 'bg-secondary';
  }
};
