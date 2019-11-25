import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { watch } from 'melanke-watchjs';
import validator from 'validator';
import axios from 'axios';

const checkInput = (url, existingLinks) => {
  if (!validator.isURL(url)) {
    return 'Not valid URL';
  }
  if (existingLinks.find((link) => link === url)) {
    return 'URL already exist';
  }
  return false;
};

const parseFeed = (xml) => {
  const channel = xml.querySelector('channel');
  const title = channel.querySelector('title').textContent;
  const description = channel.querySelector('description').textContent;
  const items = channel.querySelectorAll('item');
  const itemsList = [...items].map((item) => {
    const itemTitle = item.querySelector('title').textContent;
    const itemLink = item.querySelector('link').textContent;
    return { itemTitle, itemLink };
  });
  return { title, description, itemsList };
};

export default () => {
  const state = {
    feed: {
      title: '',
      description: '',
      articlesLinks: '',
    },
    urlForm: {
      state: 'empty',
      message: '',
    },
    links: [],
  };

  const formElement = document.getElementById('inputForm');
  const urlInput = document.getElementById('addURL');
  const invalidFeedback = formElement.querySelector('.invalid-feedback');
  const submitBtn = document.getElementById('submitButton');
  const crossOrigin = 'http://cors-anywhere.herokuapp.com/';
  const feeds = document.querySelector('.feeds');
  const links = document.querySelector('.links');

  watch(state.feed, 'title', () => {
    const feedItem = document.createElement('li');
    feedItem.classList.add('list-groupitem');
    feedItem.innerHTML = `<h4>${state.feed.title}</h4><p>${state.feed.description}</p>`;
    feeds.append(feedItem);

    state.feed.articlesLinks.forEach((el) => {
      const link = document.createElement('li');
      link.classList.add('list-group-item');
      link.innerHTML = `<a href="${el.itemLink}">${el.itemTitle}</a>`;
      links.append(link);
    });
  });

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

    const errUrl = checkInput(url, state.links);
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
        return document;
      })
      .then((feed) => {
        const dataFeed = parseFeed(feed);
        state.feed.title = dataFeed.title;
        state.feed.description = dataFeed.description;
        state.feed.articlesLinks = dataFeed.itemsList;
      })
      .catch((err) => console.log(err));
    state.links = [...state.links, urlInput.value];
    urlInput.value = '';
  });
};
