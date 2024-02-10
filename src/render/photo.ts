import i18next from 'i18next';
import { Constants } from '../constants';
import { Strings } from '../strings';

export const renderPhoto = (
  properties: RenderProperties,
  photo: APIPhoto | APIMosaicPhoto
): ResponseInstructions => {
  const { status, engagementText, authorText, isOverrideMedia, userAgent } = properties;
  const instructions: ResponseInstructions = { addHeaders: [] };

  if ((status.media?.photos?.length || 0) > 1 && (!status.media?.mosaic || isOverrideMedia)) {
    photo = photo as APIPhoto;

    const all = status.media?.all as APIMedia[];
    const baseString =
      all.length === status.media?.photos?.length ? i18next.t('photoCount') : i18next.t('mediaCount');

    const photoCounter = baseString.format({
      number: String(all.indexOf(photo) + 1),
      total: String(all.length)
    });

    const isTelegram = (userAgent?.indexOf('Telegram') ?? 0) > -1;

    if (authorText === Strings.DEFAULT_AUTHOR_TEXT || isTelegram) {
      instructions.authorText = photoCounter;
    } else {
      instructions.authorText = `${authorText}${authorText ? '   ―   ' : ''}${photoCounter}`;
    }

    if (engagementText && !isTelegram) {
      instructions.siteName = `${Constants.BRANDING_NAME} - ${engagementText} - ${photoCounter}`;
    } else {
      instructions.siteName = `${Constants.BRANDING_NAME} - ${photoCounter}`;
    }
  }

  console.log('photo!', photo);

  if (photo.type === 'mosaic_photo' && !isOverrideMedia) {
    instructions.addHeaders = [
      `<meta property="twitter:image" content="${photo.formats.jpeg}"/>`,
      `<meta property="og:image" content="${photo.formats.jpeg}"/>`
    ];
  } else {
    instructions.addHeaders = [
      `<meta property="twitter:image" content="${photo.url}"/>`,
      `<meta property="og:image" content="${photo.url}"/>`,
      `<meta property="twitter:image:width" content="${photo.width}"/>`,
      `<meta property="twitter:image:height" content="${photo.height}"/>`,
      `<meta property="og:image:width" content="${photo.width}"/>`,
      `<meta property="og:image:height" content="${photo.height}"/>`
    ];
  }

  return instructions;
};
