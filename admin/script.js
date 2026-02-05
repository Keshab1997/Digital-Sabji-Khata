document.getElementById('navbar').innerHTML = renderNavbar();
document.getElementById('footer').innerHTML = renderFooter();

async function init() {
  await checkAuth();
}

init();
