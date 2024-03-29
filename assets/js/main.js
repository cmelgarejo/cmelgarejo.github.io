let lastWindowWidth = document.documentElement.clientWidth;
const scrollAndResizeHandler = (e) => {
  if ((lastWindowWidth >= 560 && document.documentElement.clientWidth < 560)
    || (lastWindowWidth < 560 && document.documentElement.clientWidth >= 560)) {
    document.getElementsByClassName('nav-icon')[0].classList.remove('open');
    document.getElementById('navbar').classList.remove('shown');
  }
  if (document.documentElement.clientWidth < 560) {
    document.querySelectorAll('nav ul li').forEach(e => (e.classList.remove('selected')));
    return;
  }
  if (document.body.scrollTop > window.innerHeight * 0.32 || document.documentElement.scrollTop > window.innerHeight * 0.32) {
    document.getElementById('navbar').classList.add('shown');
  }
  else {
    document.getElementById('navbar').classList.remove('shown');
  }
  setSelectedNavLink();
  lastWindowWidth = document.documentElement.clientWidth;
}
const setSelectedNavLink = () => {
  let sections = ['writing', 'projects', 'education', 'experience', 'introduction'];
  let sectionScrolls = sections.map(v => ({
    name: v,
    // visible: document.getElementById(v).offsetTop <= (document.documentElement.scrollTop)
  }));
  sectionScrolls.sort((a, b) => b.visible - a.visible);
  document.querySelectorAll('nav ul li').forEach(e => (e.classList.remove('selected')));
  document.getElementById(`${sectionScrolls[0].name}Link`).classList.add('selected');
}
document.addEventListener("DOMContentLoaded", function() {
  document.getElementById('seniority').innerHTML = (new Date(new Date() - new Date('2005-01-01')).getFullYear() - 1970);
  document.addEventListener('scroll', scrollAndResizeHandler);
  window.addEventListener('resize', scrollAndResizeHandler);
  document.querySelectorAll('nav ul li').forEach(el =>
    el.addEventListener('click', function(e){
    if(document.documentElement.clientWidth < 560) {
      document.getElementsByClassName('nav-icon')[0].classList.remove('open');
      document.getElementById('navbar').classList.remove('shown');
    }
  }));
});
