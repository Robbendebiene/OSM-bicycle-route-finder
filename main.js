"use-strict";

document.addEventListener('DOMContentLoaded', main);

function main() {
  const searchCriteriaForm = document.getElementById('searchCriteria');
  searchCriteriaForm.addEventListener('submit', handleSearchCriteriaSubmit);
}


/**
 * Handles the search criteria submit event
 **/
async function handleSearchCriteriaSubmit(event) {
  // prevent form submission
  event.preventDefault();

  const searchCriteriaForm = document.getElementById('searchCriteria');
  const resultsListElement = document.getElementById('results');

  // remove any previous dom elements
  while (resultsListElement.firstElementChild) {
    resultsListElement.firstElementChild.remove();
  }

  const tags = {};
  for (const element of searchCriteriaForm.elements) {
    if (element.value.trim()) {
      tags[element.name] = element.value;
    }
  }

  if (Object.entries(tags).length > 0) {
    resultsListElement.classList.add("is-searching");
    const result = await queryByTags(tags);
    resultsListElement.classList.remove("is-searching");

    // add found elements
    for (const item of result.elements) {
      resultsListElement.append(
        createResultItem(item)
      );
    }
  }
}


/**
 * Expects tags as a key value object
 * This builds an Overpass API query by the given tags and returns the JSON result.
 **/
async function queryByTags(tags) {
  const overpassTags = Object.entries(tags)
    .map((entry) => {
      const [key, value] = entry;
      // search for string containing the value and disable case sensitivity
      return `["${key}"~"${value}", i]`
    })
    .join('');

  const query = `
    [out:json][timeout:300];
    relation["route"="bicycle"]${overpassTags};
    out tags;
  `;

  const response = await fetch(
    'https://lz4.overpass-api.de/api/interpreter',
    {
      method: 'POST',
      referrerPolicy: 'no-referrer',
      body: query
    }
  );
  return response.json();
}


function createResultItem(item) {
  const itemElement = document.createElement('article');
  itemElement.classList.add("result-item");

  const headerElement = document.createElement('header');
  itemElement.append(headerElement);

  const mainElement = document.createElement('main');
  itemElement.append(mainElement);

  // created linked name build of ref and name
  const linkElement = document.createElement('a');
  linkElement.href = `https://www.openstreetmap.org/relation/${item.id}`;
  headerElement.append(linkElement);

  const headingElement = document.createElement('h2');
  linkElement.append(headingElement);

  if (item.tags.hasOwnProperty('ref')) {
    headingElement.textContent = item.tags['ref'];
  }
  if (item.tags.hasOwnProperty('name')) {
    if (!headingElement.hasChildNodes()) {
      headingElement.textContent = item.tags['name'];
    }
    else {
      headingElement.textContent += ' - ' + item.tags['name'];
    }
  }
  if (!headingElement.hasChildNodes()) {
    headingElement.textContent = item.id;
  }

  if (item.tags.hasOwnProperty('image')) {
    const image = document.createElement('img');
    image.src = item.tags['image'];
    mainElement.append(image);
  }
  if (item.tags.hasOwnProperty('description')) {
    const description = document.createElement('p');
    description.textContent = item.tags['description'];
    mainElement.append(description);
  }

  // additional tags
  if (Object.entries(item.tags).length > 0) {
    const detailsElement = document.createElement('details');
    const summaryElement = document.createElement('summary');
    summaryElement.textContent = 'OSM Tags';
    const tableElement = document.createElement('table');
    tableElement.classList.add('result-item-tags');

    for (const [key, value] of Object.entries(item.tags)) {
      tableElement.append(
        createResultItemTag(key, value)
      );
    }
    detailsElement.append(summaryElement);
    detailsElement.append(tableElement);
    mainElement.append(detailsElement);
  }

  return itemElement;
}


function createResultItemTag(name, value) {
  const rowElement = document.createElement('tr');
  const nameElement = document.createElement('td');
  const valueElement = document.createElement('td');
  rowElement.append(nameElement, valueElement);

  nameElement.textContent = name;
  valueElement.textContent = value;

  return rowElement;
}
