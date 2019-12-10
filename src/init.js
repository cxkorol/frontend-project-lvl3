import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { watch } from 'melanke-watchjs';
import validator from 'validator';
import axios from 'axios';
import $ from 'jquery';
import _ from 'lodash';
import i18next from './i18next';
import parseFeed from './parser';

export default () => {
  const state = {
    feed: {
      title: '',
      description: '',
      articlesLinks: [],
    },
    urlForm: {
      state: 'empty',
      message: '',
    },
    links: [],
  };

  const checkInput = (url, existingLinks) => {
    if (!validator.isURL(url)) {
      return i18next.t('invalid');
    }
    if (existingLinks.find((link) => link === url)) {
      return i18next.t('dublicate');
    }
    return false;
  };

  const crossOrigin = 'http://cors-anywhere.herokuapp.com/';
  const buildURL = (url) => `${crossOrigin}${url}`;

  const updateFeeds = (feeds, latestPubDate) => {
    axios.get(`${crossOrigin}${feeds}`)
      .then((response) => {
        const dataFeed = parseFeed(response);
        const newPost = dataFeed.itemsList.filter((item) => item.pubDate > latestPubDate);
        const newPostPubDate = _.max(newPost.map(({ pubDate }) => pubDate));
        state.feed.articlesLinks = [...newPost, ...state.feed.articlesLinks];
        setTimeout(() => updateFeeds(feeds, newPostPubDate), 5000);
      })
      .catch((err) => console.error('error', err.message));
  };

  const formElement = document.getElementById('inputForm');
  const urlInput = document.getElementById('addURL');
  const invalidFeedback = formElement.querySelector('.invalid-feedback');
  const submitBtn = document.getElementById('submitButton');
  const submitBtnSpinner = submitBtn.querySelector('.spinner-grow');
  const feeds = document.querySelector('.feeds');
  const links = document.querySelector('.links');
  const content = document.querySelector('.content');

  watch(state.feed, 'title', () => {
    if (state.links.length > 0) {
      content.classList.remove('d-none');
    }

    const feedItem = document.createElement('li');
    feedItem.classList.add('list-group-item');
    feedItem.innerHTML = `<h4>${state.feed.title}</h4><p>${state.feed.description}</p>`;
    feeds.append(feedItem);
  });

  watch(state.feed, 'articlesLinks', () => {
    const articles = state.feed.articlesLinks.map((el) => `
      <li class="list-group-item">
        <a href="${el.itemLink}">${el.itemTitle}</a>
        <button type="button" class="btn btn-outline-info btn-sm" data-toggle="modal" data-target="#modal" data-title="${el.itemTitle}" data-description="${el.itemDescription}">Preview</button>
      </li>
    `).join('');
    links.innerHTML = articles;

    $('#modal').on('show.bs.modal', (event) => {
      const button = $(event.relatedTarget);
      const title = button.data('title');
      const description = button.data('description');
      const modal = $(event.currentTarget);
      modal.find('.modal-title').text(title);
      modal.find('.description').text(description);
    });
  });

  watch(state, 'urlForm', () => {
    invalidFeedback.textContent = '';
    urlInput.classList.remove('is-invalid');
    urlInput.classList.remove('is-valid');
    submitBtnSpinner.classList.remove('d-none');
    urlInput.disabled = false;
    submitBtn.disabled = false;

    switch (state.urlForm.state) {
      case 'empty':
        submitBtnSpinner.classList.add('d-none');
        submitBtn.disabled = true;
        urlInput.value = '';
        break;
      case 'invalid':
        urlInput.classList.add('is-invalid');
        submitBtnSpinner.classList.add('d-none');
        submitBtn.disabled = true;
        invalidFeedback.textContent = state.urlForm.message;
        break;
      case 'valid':
        urlInput.classList.add('is-valid');
        submitBtnSpinner.classList.add('d-none');
        break;
      case 'loading':
        urlInput.disabled = true;
        submitBtn.disabled = true;
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
    state.urlForm.state = 'loading';
    const link = buildURL(urlInput.value);
    axios.get(link)
      .then((feed) => {
        const dataFeed = parseFeed(feed);
        state.feed.title = dataFeed.title;
        state.feed.description = dataFeed.description;
        state.feed.articlesLinks = [...dataFeed.itemsList, ...state.feed.articlesLinks];
        state.links = [...state.links, urlInput.value];
        state.urlForm.state = 'empty';
        const maxPubDate = _.max(dataFeed.itemsList.map(({ pubDate }) => pubDate));
        setTimeout(() => updateFeeds(link, maxPubDate), 5000);
      })
      .catch(() => {
        state.urlForm.state = 'invalid';
        state.urlForm.message = i18next.t('invalid');;
      });
  });
};
