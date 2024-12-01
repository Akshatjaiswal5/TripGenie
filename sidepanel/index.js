import { AISession, Translator } from './scripts/ai.js';
import { LocationService } from './scripts/location-service.js';
import { getActiveTab } from './scripts/browser-utils.js';
import { PDFExporter } from './scripts/pdf-exporter.js';
import { marked } from 'marked';


const DOM = {
  loadingScreen: document.body.querySelector('#loading'),
  errorScreen: document.body.querySelector('#error'),
  welcomeScreen: document.body.querySelector('#welcome'),
  itineraryScreen: document.body.querySelector('#itinerary'),
  errorMessage: document.body.querySelector('#error-message'),
  loadingMessage: document.body.querySelector('#loading-message'),
  buttonGenerate: document.body.querySelector('#button-generate'),
  buttonReset: document.body.querySelector('#button-reset'),
  itineraryContent: document.body.querySelector('#itinerary-content'),
  placeName: document.body.querySelector('#place-name'),
  placesList: document.body.querySelector('#places-list'),
  daysSelect: document.body.querySelector('#days'),
  buttonDownload: document.body.querySelector('#button-download'),
  buttonModifyItinerary: document.body.querySelector('#button-modify-itinerary'),
  languageSelect: document.body.querySelector('#language'),
  header: document.body.querySelector('#header'),
  inputModifyItinerary: document.body.querySelector('#input-modify-itinerary'),
  additionalReqs: document.body.querySelector('#additional-requirements')
}
DOM.loadingScreen.style.display = 'none';
DOM.errorScreen.style.display = 'none';
DOM.welcomeScreen.style.display = 'none';
DOM.itineraryScreen.style.display = 'none';
DOM.buttonGenerate.onclick = generateItinerary;
DOM.buttonReset.onclick = refreshWelcomePage;
DOM.buttonDownload.onclick = downloadPDF;
DOM.buttonModifyItinerary.onclick = modifyItinerary;
DOM.languageSelect.onchange = translateItinerary;

let coords;
let location;
let currentItineraryInEnglish;
let nearbyAttractions;
let currentPage;

function downloadPDF() {
  const doc = document.createElement("div");
  doc.innerHTML = DOM.itineraryContent.innerHTML.toString();
  PDFExporter.exportItinerary(doc, `${location} [${DOM.daysSelect.value}-day] [${DOM.languageSelect.value}] Itinerary.pdf`);
}

async function translateItinerary() {
  showLoading('Translating itinerary...');
  let itinerary = currentItineraryInEnglish;

  if (DOM.languageSelect.value !== 'en') {
    itinerary = await Translator.translate(itinerary, DOM.languageSelect.value);
  }

  DOM.itineraryContent.innerHTML = marked.parse(itinerary);;
  DOM.itineraryScreen.style.display = '';
  DOM.welcomeScreen.style.display = 'none';
  closeLoading();
}


function getSelectedChoices() {
  const places = Array.from(DOM.placesList.querySelectorAll('input[type="checkbox"]:checked')).map(checkbox => checkbox.value);
  const days = DOM.daysSelect.value;
  const additionalReqs = DOM.additionalReqs.value.trim();
  return {
    places: places,
    days: days,
    additionalReqs: additionalReqs,
  };
}

function showLoading(message) {
  DOM.loadingMessage.innerHTML = message;
  DOM.header.style.display = 'none';
  DOM.loadingScreen.style.display = '';
  DOM.welcomeScreen.style.display = 'none';
  DOM.errorScreen.style.display = 'none';
  DOM.itineraryScreen.style.display = 'none';
}

function closeLoading() {
  DOM.loadingScreen.style.display = 'none';
  DOM.header.style.display = '';
}


async function modifyItinerary() {
  try {
    if(DOM.inputModifyItinerary.value === "") {
      return
    }
    showLoading('Modifying itinerary...');
    const prompt = `
      Modify the previous response to include the following changes: ${DOM.inputModifyItinerary.value}
    `;
    let itinerary = await AISession.prompt(prompt);
    itinerary = marked.parse(itinerary);
    currentItineraryInEnglish = itinerary;
  
    if (DOM.languageSelect.value !== 'en') {
      itinerary = await Translator.translate(itinerary, DOM.languageSelect.value);
    }
  
    DOM.inputModifyItinerary.value = '';
    DOM.itineraryContent.innerHTML = marked.parse(itinerary);;
    DOM.itineraryScreen.style.display = '';
    DOM.welcomeScreen.style.display = 'none';
    closeLoading();
  } catch (error) {
    showError(error.message);
  }
  
}

async function generateItinerary() {
  try {
    showLoading('Crafting your perfect itinerary...');
    const { places, days, additionalReqs } = getSelectedChoices();

    let itinerary = await AISession.prompt(`
      Generate a ${days}-day travel itinerary for places nearby ${location}
      Mostly include these places: 
      ${places.length >0 ? places.join(', \n'): ""}
      The plan should be in detailed form. 
      Arrange the places in a way that makes sense, to minimise back and forth travel
      ${additionalReqs}
      Only answer this prompt if the plan is feasible that is, all the provided places can be toured in ${days} days.
      Otherwise ask user to increase the number of days.`);
    itinerary = marked.parse(itinerary);
    currentItineraryInEnglish = itinerary;

    if (DOM.languageSelect.value !== 'en') {
      itinerary = await Translator.translate(itinerary, DOM.languageSelect.value);
    }

    DOM.itineraryContent.innerHTML = marked.parse(itinerary);
    DOM.itineraryScreen.style.display = '';
    DOM.welcomeScreen.style.display = 'none';

    closeLoading();
  } catch (error) {
    showError(error.message);
    throw error;
  }
}

async function checkCurrentPage() {
  currentPage = await getActiveTab();
  if (!currentPage.url?.startsWith('https://www.google.com/maps')) {
    throw new Error('Please navigate to Google Maps first');
  }
  return currentPage;
}

async function checkChrome() {    
  if (!('aiOriginTrial' in chrome)) {
    throw new Error('chrome.aiOriginTrial not supported in this browser');
  }
  let defaults = await chrome.aiOriginTrial.languageModel.capabilities();
  if (defaults.available !== 'readily') {
    throw new Error(`AI Model not yet available (current state: "${defaults.available}")`);
  }
}

function showError(message) {
  DOM.header.style.display = 'none';
  DOM.welcomeScreen.style.display = 'none';
  DOM.loadingScreen.style.display = 'none';
  DOM.itineraryScreen.style.display = 'none';
  DOM.errorScreen.style.display = '';
  DOM.errorMessage.innerHTML = message;
}

async function refreshWelcomePage() {
  showLoading('Loading the places nearby...');
  await AISession.destroy();
  DOM.languageSelect.value = 'en';

  const tab = await checkCurrentPage();
  coords = LocationService.extractCoordinates(tab.url);

  location = await LocationService.fetchPlaceName(coords.latitude, coords.longitude);
  nearbyAttractions = await LocationService.fetchPopularNearByLocation(coords.latitude, coords.longitude);

  DOM.placeName.innerHTML = location;
  DOM.placesList.innerHTML = nearbyAttractions.map((attraction) => 
    `<li><label><input type="checkbox" value="${attraction.name}"> ${attraction.name}</label></li>`
  ).join('');

  DOM.welcomeScreen.style.display = '';
  DOM.itineraryScreen.style.display = 'none';
  closeLoading();
}

async function initApp() {
  try {
    await checkChrome();
    await checkCurrentPage();
    await refreshWelcomePage();
  } catch (error) {
    showError(error.message);
  }
}

initApp();
