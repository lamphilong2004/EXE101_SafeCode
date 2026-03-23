const fs = require('fs');
const path = require('path');

const srcPaths = {
  ui: ['Badge.jsx', 'Badge.css', 'Button.jsx', 'Button.css', 'Card.jsx', 'Card.css', 'Table.jsx', 'Table.css'],
  layout: ['Header.jsx', 'Header.css', 'Layout.jsx', 'Sidebar.jsx', 'Sidebar.css'],
  auth: ['Login.jsx', 'Login.css'],
  dashboards: ['FreelancerDashboard.jsx', 'ClientDashboard.jsx', 'Dashboard.css'],
  features: ['Upload.jsx', 'Upload.css', 'Files.jsx', 'Credits.jsx', 'Credits.css', 'Settings.jsx', 'Settings.css']
};

const dirs = {
  ui: './src/components/ui',
  layout: './src/components/layout',
  auth: './src/pages/auth',
  dashboards: './src/pages/dashboards',
  features: './src/pages/features'
};

// Create dirs
Object.values(dirs).forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// Move files
srcPaths.ui.forEach(f => safeMove(`./src/components/${f}`, `./src/components/ui/${f}`));
srcPaths.layout.forEach(f => safeMove(`./src/components/${f}`, `./src/components/layout/${f}`));
srcPaths.auth.forEach(f => safeMove(`./src/pages/${f}`, `./src/pages/auth/${f}`));
srcPaths.dashboards.forEach(f => safeMove(`./src/pages/${f}`, `./src/pages/dashboards/${f}`));
srcPaths.features.forEach(f => safeMove(`./src/pages/${f}`, `./src/pages/features/${f}`));

function safeMove(src, dest) {
  if (fs.existsSync(src)) {
    fs.renameSync(src, dest);
  }
}

// Update App.jsx imports
let appContent = fs.readFileSync('./src/App.jsx', 'utf8');
appContent = appContent.replace(/'\.\/components\/Layout'/g, "'./components/layout/Layout'");
appContent = appContent.replace(/'\.\/pages\/Login'/g, "'./pages/auth/Login'");
appContent = appContent.replace(/'\.\/pages\/FreelancerDashboard'/g, "'./pages/dashboards/FreelancerDashboard'");
appContent = appContent.replace(/'\.\/pages\/ClientDashboard'/g, "'./pages/dashboards/ClientDashboard'");
appContent = appContent.replace(/'\.\/pages\/Upload'/g, "'./pages/features/Upload'");
appContent = appContent.replace(/'\.\/pages\/Files'/g, "'./pages/features/Files'");
appContent = appContent.replace(/'\.\/pages\/Credits'/g, "'./pages/features/Credits'");
appContent = appContent.replace(/'\.\/pages\/Settings'/g, "'./pages/features/Settings'");
fs.writeFileSync('./src/App.jsx', appContent);

// Update page imports
const pagesToUpdate = [
  ...srcPaths.auth.map(f => `./src/pages/auth/${f}`),
  ...srcPaths.dashboards.map(f => `./src/pages/dashboards/${f}`),
  ...srcPaths.features.map(f => `./src/pages/features/${f}`)
].filter(f => f.endsWith('.jsx'));

pagesToUpdate.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/'\.\.\/components\//g, "'../../components/ui/");
    fs.writeFileSync(file, content);
  }
});

// Update specific edge case for Files.jsx
const filesJsxPath = './src/pages/features/Files.jsx';
if (fs.existsSync(filesJsxPath)) {
  let content = fs.readFileSync(filesJsxPath, 'utf8');
  content = content.replace(/'\.\/Dashboard\.css'/g, "'../dashboards/Dashboard.css'");
  fs.writeFileSync(filesJsxPath, content);
}

console.log('Reorganization complete!');
