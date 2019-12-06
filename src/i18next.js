import i18next from 'i18next';

i18next.init({
    lng: 'en',
    debug: true,
    resources: {
      en: {
        translation: {
          dublicate: 'URL already exist',
          invalid: 'Not valid URL',
          error: 'Something went wrong',
        },
      },
    },
  });

  export default i18next;