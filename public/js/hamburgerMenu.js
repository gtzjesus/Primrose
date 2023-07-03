const primaryNavigation = document.querySelector('.primary__navigation');
const navigationToggle = document.querySelector('.mobile__nav__toggle');

navigationToggle.addEventListener('click', function () {
  const visibility = primaryNavigation.getAttribute('data-visible');
  // console.log(visibility);

  if (visibility === 'false') {
    primaryNavigation.setAttribute('data-visible', true);
    navigationToggle.setAttribute('aria-expanded', true);
  } else if (visibility === 'true') {
    primaryNavigation.setAttribute('data-visible', false);
    navigationToggle.setAttribute('aria-expanded', false);
  }
  return;
});
