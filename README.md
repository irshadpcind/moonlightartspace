# Logic Games - Threadline & Don't Bug the Bee

A beautiful web-based puzzle game collection featuring two brain-training games designed to improve logic, memory, and problem-solving skills.

## 🎮 Games

### Threadline
A daily logic path puzzle where you draw one continuous thread through numbered points (1-9) in sequence, visiting every empty cell exactly once. Features:
- Daily puzzles (same for all players)
- Grid-based pathfinding challenges
- Walls and obstacles for added difficulty
- Trains logic, planning, and sequential thinking

### Don't Bug the Bee
A memory-path puzzle where you memorize bug positions during a 1-second flash, then guide a bee to a flower while avoiding hidden bugs. Features:
- 5 progressive sets per level
- Increasing difficulty (3-5 bugs, 5x5 to 6x6 grids)
- Lives system with retry mechanics
- Trains working memory, attention, and spatial planning

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- No additional software required!

### Installation
1. Download or clone this repository
2. Open `index.html` in your web browser
3. Start playing immediately!

### Local Development
If you want to serve the files locally:
```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (if you have http-server installed)
npx http-server

# Using PHP
php -S localhost:8000
```

Then visit `http://localhost:8000` in your browser.

## 🎯 How to Play

### Threadline
1. Click "Play Threadline" from the home screen
2. Start by clicking on number "1"
3. Drag your mouse to adjacent cells to draw a continuous path
4. Visit numbers 1-9 in order
5. Fill every empty cell exactly once
6. Avoid walls (dark cells)
7. Complete the puzzle to see your time and moves

### Don't Bug the Bee
1. Click "Play Don't Bug the Bee" from the home screen
2. Click "Start Set" to begin
3. Watch carefully as bugs flash red for 1 second
4. Remember their positions!
5. Draw a path from the bee 🐝 to the flower 🌸
6. Avoid the hidden bug locations
7. Complete all 5 sets to finish the level

## 🎨 Features

- **Beautiful Modern UI**: Glassmorphism design with smooth animations
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Progressive Web App**: Install on your device for native-like experience
- **Dark Mode Support**: Automatically adapts to your system preference
- **Local Storage**: Saves your progress and completion times
- **Touch-Friendly**: Optimized for both mouse and touch input
- **Accessibility**: Keyboard navigation and screen reader friendly

## 🛠️ Technical Details

### Built With
- **HTML5**: Semantic markup and modern web standards
- **CSS3**: Advanced styling with CSS Grid, Flexbox, and animations
- **Vanilla JavaScript**: No frameworks - pure, fast JavaScript
- **Progressive Web App**: Offline capability and installable

### Browser Support
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Performance
- Lightweight: < 100KB total size
- Fast loading: Optimized assets and minimal dependencies
- Smooth animations: 60fps gameplay experience
- Memory efficient: Optimized algorithms and cleanup

## 📱 Mobile Experience

The games are fully optimized for mobile devices:
- Touch-friendly controls
- Responsive grid sizing
- Optimized button layouts
- PWA installation for native feel
- Portrait orientation lock for better gameplay

## 🎯 Game Design Philosophy

### Threadline
- **Logic Training**: Develops sequential thinking and planning ahead
- **Spatial Reasoning**: Improves understanding of grid-based movement
- **Problem Solving**: Teaches constraint satisfaction and backtracking
- **Daily Challenge**: Consistent difficulty with fresh content

### Don't Bug the Bee
- **Working Memory**: Strengthens short-term memory retention
- **Attention Training**: Improves focus and concentration
- **Spatial Memory**: Develops location-based memory skills
- **Progressive Difficulty**: Gradual skill building with clear advancement

## 🚀 Deployment

### Static Hosting (Recommended)
Deploy to any static hosting service:

**Netlify:**
1. Drag and drop the project folder to Netlify
2. Your site is live instantly!

**Vercel:**
1. Connect your GitHub repository
2. Deploy automatically on every push

**GitHub Pages:**
1. Push to a GitHub repository
2. Enable Pages in repository settings
3. Select main branch as source

**Other Options:**
- Firebase Hosting
- AWS S3 + CloudFront
- Azure Static Web Apps
- Any web server (Apache, Nginx, etc.)

### Custom Domain
1. Update the `start_url` in `manifest.json` to your domain
2. Update any absolute paths if needed
3. Configure your hosting service for your custom domain

## 🔧 Customization

### Adding New Puzzles
Edit the puzzle generation functions in:
- `threadline.js` - Modify `generatePuzzle()` method
- `bee-game.js` - Modify `levelConfig` array

### Styling Changes
- `styles.css` - Main stylesheet with CSS custom properties
- Modify color scheme by updating CSS variables
- Responsive breakpoints can be adjusted in media queries

### Game Mechanics
- Difficulty levels in `bee-game.js`
- Grid sizes and number ranges in `threadline.js`
- Scoring systems in respective game files

## 🐛 Troubleshooting

### Common Issues

**Games not loading:**
- Ensure all files are in the same directory
- Check browser console for JavaScript errors
- Try refreshing the page

**Touch controls not working:**
- Ensure you're using a modern browser
- Try clearing browser cache
- Check if touch events are supported

**PWA not installing:**
- Serve over HTTPS (required for PWA features)
- Ensure manifest.json is accessible
- Check browser PWA requirements

### Performance Issues
- Close other browser tabs to free memory
- Disable browser extensions that might interfere
- Try a different browser
- Clear browser cache and data

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on multiple devices
5. Submit a pull request

## 🎉 Credits

Created with ❤️ for puzzle game enthusiasts and brain training advocates.

**Game Concepts:**
- Threadline: Inspired by number connection puzzles
- Don't Bug the Bee: Original memory-based pathfinding concept

**Design:**
- Modern glassmorphism UI design
- Responsive and accessible interface
- Mobile-first approach

---

Enjoy training your brain with these engaging logic puzzles! 🧠✨
