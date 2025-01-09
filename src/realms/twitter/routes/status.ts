import { Context } from 'hono';
import { Constants } from '../../../constants';
import { getBaseRedirectUrl } from '../router';
import { DataProvider, handleStatus } from '../../../embed/status';
import { Strings } from '../../../strings';
import { Experiment, experimentCheck } from '../../../experiments';

/* Handler for status request */
export const statusRequest = async (c: Context) => {
  const { prefix, handle, id, mediaNumber, language } = c.req.param();
  const url = new URL(c.req.url);
  const flags: InputFlags = {};

  // eslint-disable-next-line sonarjs/no-duplicate-string
  const userAgent = c.req.header('User-Agent') || '';

  /* Let's return our HTML version for wayback machine (we can add other archivers too in future) */
  if (
    ['archive.org', 'Wayback Machine'].some(service => c.req.header('Via')?.includes?.(service))
  ) {
    console.log('Request from archive.org');
    flags.archive = true;
  }

  /* User Agent matching for embed generators, bots, crawlers, and other automated
     tools. It's pretty all-encompassing. Note that Firefox/92 is in here because 
     Discord sometimes uses the following UA:
     
     Mozilla/5.0 (Macintosh; Intel Mac OS X 11.6; rv:92.0) Gecko/20100101 Firefox/92.0
     
     I'm not sure why that specific one, it's pretty weird, but this edge case ensures
     stuff keeps working.
     
     On the very rare off chance someone happens to be using specifically Firefox 92,
     the http-equiv="refresh" meta tag will ensure an actual human is sent to the destination. */
  const isBotUA = userAgent.match(Constants.BOT_UA_REGEX) !== null || flags?.archive;

  /* Check if domain is a direct media domain (i.e. d.fxtwitter.com),
     the status is prefixed with /dl/ or /dir/ (for TwitFix interop), or the
     status ends in .mp4, .jpg, .jpeg, or .png
      
     Note that .png is not documented because images always redirect to a jpg,
     but it will help someone who does it mistakenly on something like Discord
      
     Also note that all we're doing here is setting the direct flag. If someone
     links a video and ends it with .jpg, it will still redirect to a .mp4! */
  if (url.pathname.match(/\/status(es)?\/\d{2,20}\.(mp4|png|jpe?g|gifv?)/g)) {
    console.log('Direct media request by extension');
    flags.direct = true;
  } else if (Constants.DIRECT_MEDIA_DOMAINS.includes(url.hostname)) {
    console.log('Direct media request by domain');
    flags.direct = true;
  } else if (Constants.TEXT_ONLY_DOMAINS.includes(url.hostname)) {
    console.log('Text-only embed request');
    flags.textOnly = true;
  } else if (Constants.INSTANT_VIEW_DOMAINS.includes(url.hostname)) {
    console.log('Forced instant view request');
    flags.forceInstantView = true;
  } else if (experimentCheck(Experiment.IV_FORCE_THREAD_UNROLL, userAgent.includes('Telegram'))) {
    console.log('Forced unroll instant view');
    flags.instantViewUnrollThreads = true;
  } else if (Constants.GALLERY_DOMAINS.includes(url.hostname)) {
    console.log('Gallery embed request');
    flags.gallery = true;
  } else if (Constants.NATIVE_MULTI_IMAGE_DOMAINS.includes(url.hostname)) {
    console.log('Force native multi-image');
    flags.nativeMultiImage = true;
  } else if (prefix === 'dl' || prefix === 'dir') {
    console.log('Direct media request by path prefix');
    flags.direct = true;
  }

  /* Support redirecting to specific quality of image, like:
  
     https://pbs.twimg.com/media/foobar.jpg:orig
    
     TODO: Should we support video file like :1280x720, though it's not the offical way */
  if (flags.direct) {
    // check if the name is in search params, e.g. /i/status/1234567890?name=orig
    const nameFromSearchParams = url.searchParams.get('name');
    if (nameFromSearchParams) {
      flags.name = nameFromSearchParams;
    } else {
      // check if the status ends with :<name>, e.g. /i/status/1234567890.jpg:orig
      const matched = url.pathname.match(/\/status(?:es)?\/\d{2,20}(?:\..*?)?:(.+?)$/);
      const nameFromUrl = matched && matched[1];
      if (nameFromUrl) {
        flags.name = nameFromUrl;
      }
    }
  }

  /* TODO: Figure out what we're doing with FixTweet / FixupX branding in future */
  if (/fixup/g.test(url.href)) {
    console.log(`We're using x domain`);
    flags.isXDomain = true;
  } else {
    console.log(`We're using twitter domain`);
  }

  const baseUrl = getBaseRedirectUrl(c);

  if (Constants.API_HOST_LIST.includes(url.hostname)) {
    console.log('JSON API request');
    flags.api = true;
  }

  /* Direct media or API access bypasses bot check, returning same response regardless of UA */
  if (isBotUA || flags.direct || flags.api) {
    if (isBotUA) {
      console.log(`Matched bot UA ${userAgent}`);
    } else {
      console.log(`Bypass bot check (Presented user-agent ${userAgent})`);
    }

    /* This throws the necessary data to handleStatus (in status.ts) */
    const statusResponse = await handleStatus(
      c,
      id?.match(/\d{2,20}/)?.[0] || '0',
      null,
      mediaNumber ? parseInt(mediaNumber) : undefined,
      userAgent,
      flags,
      language,
      DataProvider.Twitter
    );
    /* Do not cache if using a custom redirect */
    const cacheControl = baseUrl !== Constants.TWITTER_ROOT ? 'max-age=0' : undefined;

    if (cacheControl) {
      // eslint-disable-next-line sonarjs/no-duplicate-string
      c.header('cache-control', cacheControl);
    }

    if (statusResponse) {
      /* We're checking if the User Agent is a bot again specifically in case they requested
         direct media (d.fxtwitter.com, .mp4/.jpg, etc) but the status contains no media.

         Since we obviously have no media to give the user, we'll just redirect to the status.
         Embeds will return as usual to bots as if direct media was never specified. */
      if (!isBotUA && !flags.api && !flags.direct) {
        const baseUrl = getBaseRedirectUrl(c);

        return c.redirect(`${baseUrl}/${handle || 'i'}/status/${id}`, 302);
      }

      c.status(200);
      /* Return the response containing embed information */
      return statusResponse;
    } else {
      /* Somehow handleStatus sent us nothing. This should *never* happen, but we have a case for it. */
      return c.text(Strings.ERROR_UNKNOWN, 500);
    }
  } else {
    /* A human has clicked a fxtwitter.com/:screen_name/status/:id link!
       Obviously we just need to redirect to the status directly.*/
    console.log('Matched human UA', userAgent);

    return c.redirect(`${baseUrl}/${handle || 'i'}/status/${id?.match(/\d{2,20}/)?.[0]}`, 302);
  }
};
