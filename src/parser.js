export default (xml) => {
    const domParcer = new DOMParser();
    const doc = domParcer.parseFromString(`${xml.data}`, 'application/xml');
    const channel = doc.querySelector('channel');
    const title = channel.querySelector('title').textContent;
    const description = channel.querySelector('description').textContent;
    const items = channel.querySelectorAll('item');
    const itemsList = [...items].map((item) => {
      const itemTitle = item.querySelector('title').textContent;
      const itemLink = item.querySelector('link').textContent;
      const itemDescription = item.querySelector('description').textContent;
      const pubDate = new Date(item.querySelector('pubDate').textContent);
      return {
        itemTitle, itemLink, itemDescription, pubDate,
      };
    });
    return { title, description, itemsList };
  };