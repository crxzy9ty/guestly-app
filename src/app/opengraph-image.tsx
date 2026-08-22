import { renderSocialImage, SOCIAL_IMAGE_SIZE } from "./social-image";

export const alt = "Fydback";
export const size = SOCIAL_IMAGE_SIZE;
export const contentType = "image/png";

export default async function OpengraphImage() {
  return renderSocialImage();
}
