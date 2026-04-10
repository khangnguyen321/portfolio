# Khang Nguyen - Portfolio

Beautiful portfolio website with Three.js 3D animations and modern design.

## 🚀 Features

- Interactive 3D background using Three.js
- Responsive design (desktop + mobile)
- Smooth scroll animations
- Contact form integration (FormSubmit)
- Custom cursor effects
- Skills visualization with icons

## 📦 Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript
- **3D Graphics**: Three.js r128
- **Animations**: Anime.js
- **Server**: Express.js (for deployment)

## 🏃 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start the server
npm start
```

Visit `http://localhost:3000` in your browser.

## 🌐 Deploy to LaunchPort

### Step 1: Create GitHub Repository

```bash
# In your local portfolio folder (Windows PowerShell)
PS C:\your-portfolio-folder> git init
PS C:\your-portfolio-folder> git add .
PS C:\your-portfolio-folder> git commit -m "Initial commit: Portfolio website"
PS C:\your-portfolio-folder> git remote add origin https://github.com/YOUR-USERNAME/portfolio.git
PS C:\your-portfolio-folder> git push -u origin main
```

### Step 2: Deploy via LaunchPort Dashboard

1. Go to https://dashboard.launchport.org
2. Click "Create New Project"
3. Enter GitHub URL: `https://github.com/YOUR-USERNAME/portfolio.git`
4. Project name: `portfolio` (or any name you want)
5. Branch: `main`
6. Click "Create Project"
7. Click "Deploy" button

Your portfolio will be deployed and running! 🎉

## 📁 Project Structure

```
portfolio/
├── index.html          # Main HTML file
├── styles.css          # All CSS styling
├── main.js            # Main JavaScript logic
├── three-scene.js     # Three.js 3D scene
├── server.js          # Express server (for deployment)
├── package.json       # Node.js dependencies
└── .gitignore         # Git ignore rules
```

## 🎨 Customization

### Update Personal Info

Edit `index.html` to change:
- Name and title
- Work experience
- Skills
- Education
- Contact information

### Color Scheme

The portfolio uses a blue/orange/lime color scheme:
- Blue: `#1a6eff`
- Orange: `#ff4d1a`
- Lime: `#e8ff47`

Edit `styles.css` to change colors.

### Contact Form

The form uses FormSubmit.co. To change the email:
- Find line 888 in `index.html`
- Replace `hk.nguyen91@gmail.com` with your email

## 📱 Responsive Design

- Desktop: Full experience with 3D animations
- Tablet: Optimized layout
- Mobile: Mobile navigation, simplified animations

## 🔧 Troubleshooting

**Portfolio not loading?**
- Check that all files are in the same directory
- Verify `npm install` ran successfully
- Check server logs for errors

**3D scene not showing?**
- Make sure Three.js CDN is accessible
- Check browser console for errors
- Verify WebGL is supported in your browser

## 📄 License

MIT License - Feel free to use this for your own portfolio!

## 👤 Author

**Khang Nguyen**
- Email: hk.nguyen91@gmail.com
- Phone: (678) 756-3756
- Location: Atlanta, Georgia

---

Built with ❤️ using modern web technologies
