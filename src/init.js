import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { watch } from 'melanke-watchjs';
import validator from 'validator';
import axios from 'axios';

const checkInput = (url) => {
  if (!validator.isURL(url)) {
    return 'Not valid URL';
  }
  return false;
};

const parseFeed = (xml) => {
  const channel = xml.querySelector('channel');
  const title = channel.querySelector('title').innerHTML;
  const description = channel.querySelector('description').innerHTML;
  const items = channel.querySelectorAll('item');
  const itemsList = [...items].map((item) => {
    const itemTitle = item.querySelector('title').innerHTML;
    const itemLink = item.querySelector('link').innerHTML;
    return { itemTitle, itemLink };
  });
  return { title, description, itemsList };
};

export default () => {
  const state = {
    feed: {
      title: '',
      description: '',
      feedLinks: '',
    },
    urlForm: {
      state: 'empty',
      message: '',
    },
  };

  const formElement = document.getElementById('inputForm');
  const urlInput = document.getElementById('addURL');
  const invalidFeedback = formElement.querySelector('.invalid-feedback');
  const submitBtn = document.getElementById('submitButton');
  const crossOrigin = 'http://cors-anywhere.herokuapp.com/';

  watch(state, 'urlForm', () => {
    invalidFeedback.textContent = '';
    urlInput.classList.remove('is-invalid');
    urlInput.classList.remove('is-valid');
    urlInput.disabled = false;
    submitBtn.disabled = false;

    switch (state.urlForm.state) {
      case 'empty':
        submitBtn.disabled = true;
        urlInput.value = '';
        break;
      case 'invalid':
        urlInput.classList.add('is-invalid');
        submitBtn.disabled = true;
        invalidFeedback.textContent = state.urlForm.message;
        break;
      case 'valid':
        urlInput.classList.add('is-valid');
        break;
      default:
    }
  });

  urlInput.addEventListener('input', (e) => {
    const url = e.target.value;
    if (url === '') {
      state.urlForm.state = 'empty';
    }

    const errUrl = checkInput(url);
    if (errUrl) {
      state.urlForm.state = 'invalid';
      state.urlForm.message = errUrl;
    } else {
      state.urlForm.state = 'valid';
    }
  });

  formElement.addEventListener('submit', (e) => {
    e.preventDefault();
    const link = `${crossOrigin}${urlInput.value}`;
    axios.get(link)
      .then((response) => {
        const domParcer = new DOMParser();
        const document = domParcer.parseFromString(`${response.data}`, 'application/xml');
        console.log(document);
        return document;
      })
      .then((feed) => {
        const dataFeed = parseFeed(feed);
        console.log(dataFeed);
        state.feed.title = dataFeed.title;
        state.feed.description = dataFeed.description;
        state.feed.feedLinks = dataFeed.itemsList;
        console.log(state);
      })
      .catch((err) => console.log(err));
    urlInput.value = '';
  });
};
