/**
 * ContentCraft Database Initialization Script
 * Creates all tables and inserts demo data
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 3306,
    multipleStatements: true
};

const initDatabase = async () => {
    let connection;
    
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to MySQL server');

        const dbName = process.env.DB_NAME || 'contentcraft';
        
        // Create database if not exists
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log(`Database '${dbName}' created or exists`);
        
        // Use the database
        await connection.query(`USE \`${dbName}\``);
        
        // Create tables
        const createTablesSQL = `
            -- Users Table
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role ENUM('user', 'admin') DEFAULT 'user',
                avatar VARCHAR(255) DEFAULT NULL,
                bio TEXT DEFAULT NULL,
                phone VARCHAR(20) DEFAULT NULL,
                location VARCHAR(100) DEFAULT NULL,
                website VARCHAR(255) DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_email (email),
                INDEX idx_role (role)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

            -- Categories Table
            CREATE TABLE IF NOT EXISTS categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(50) NOT NULL UNIQUE,
                description TEXT DEFAULT NULL,
                icon VARCHAR(50) DEFAULT 'fa-folder',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_name (name)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

            -- Blogs Table
            CREATE TABLE IF NOT EXISTS blogs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                content LONGTEXT NOT NULL,
                image VARCHAR(255) DEFAULT NULL,
                author_id INT NOT NULL,
                category_id INT NOT NULL,
                views INT DEFAULT 0,
                is_published BOOLEAN DEFAULT TRUE,
                is_featured BOOLEAN DEFAULT FALSE,
                published_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
                INDEX idx_category (category_id),
                INDEX idx_author (author_id),
                INDEX idx_published (is_published),
                INDEX idx_featured (is_featured),
                INDEX idx_created (created_at),
                INDEX idx_published_at (published_at),
                FULLTEXT INDEX idx_search (title, description, content)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

            -- Comments Table
            CREATE TABLE IF NOT EXISTS comments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                blog_id INT NOT NULL,
                user_id INT NOT NULL,
                comment TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_blog (blog_id),
                INDEX idx_user (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

            -- Ratings Table
            CREATE TABLE IF NOT EXISTS ratings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                blog_id INT NOT NULL,
                user_id INT NOT NULL,
                rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_rating (blog_id, user_id),
                INDEX idx_blog_rating (blog_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

            -- Messages Table (Contact Form)
            CREATE TABLE IF NOT EXISTS messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL,
                phone VARCHAR(20) DEFAULT NULL,
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_email (email),
                INDEX idx_read (is_read)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

            -- Saved Blogs Table (User bookmarks)
            CREATE TABLE IF NOT EXISTS saved_blogs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                blog_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE,
                UNIQUE KEY unique_save (user_id, blog_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

            -- Site Settings Table (For About, Contact info)
            CREATE TABLE IF NOT EXISTS site_settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                setting_key VARCHAR(100) NOT NULL UNIQUE,
                setting_value TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

            -- Newsletter Subscribers Table
            CREATE TABLE IF NOT EXISTS newsletter_subscribers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(100) NOT NULL UNIQUE,
                is_active BOOLEAN DEFAULT TRUE,
                subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_email (email)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

            -- FAQ Table
            CREATE TABLE IF NOT EXISTS faqs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                question TEXT NOT NULL,
                answer TEXT NOT NULL,
                category VARCHAR(50) DEFAULT 'general',
                is_published BOOLEAN DEFAULT TRUE,
                display_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

            -- Sitemap Cache Table
            CREATE TABLE IF NOT EXISTS sitemap_cache (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sitemap_type VARCHAR(50) NOT NULL,
                content LONGTEXT,
                last_generated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_type (sitemap_type)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;

        await connection.query(createTablesSQL);
        console.log('All tables created successfully');

        // Insert default categories with icons
        const categories = [
            ['Technology', 'Latest tech news, tutorials, and insights', 'fa-laptop-code'],
            ['Programming', 'Coding tutorials, tips, and best practices', 'fa-code'],
            ['Design', 'UI/UX design, graphics, and creative inspiration', 'fa-palette'],
            ['Business', 'Entrepreneurship, marketing, and business strategies', 'fa-briefcase'],
            ['Lifestyle', 'Health, wellness, and personal development', 'fa-heart'],
            ['Travel', 'Travel guides, tips, and experiences', 'fa-plane'],
            ['Food', 'Recipes, restaurant reviews, and culinary adventures', 'fa-utensils'],
            ['Entertainment', 'Movies, music, games, and pop culture', 'fa-film'],
            ['AI & Machine Learning', 'Artificial intelligence and ML developments', 'fa-robot'],
            ['Web Development', 'Modern web development techniques', 'fa-globe']
        ];

        for (const [name, description, icon] of categories) {
            await connection.query(
                'INSERT IGNORE INTO categories (name, description, icon) VALUES (?, ?, ?)',
                [name, description, icon]
            );
        }
        console.log('Default categories inserted');

        // Verify categories were inserted
        const [categoryCheck] = await connection.query('SELECT id, name FROM categories');
        console.log(`Verified ${categoryCheck.length} categories`);

        if (categoryCheck.length === 0) {
            throw new Error('Categories failed to insert! Cannot proceed.');
        }

        // Create admin user
        const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@contentcraft.com';
        
        await connection.query(
            `INSERT IGNORE INTO users (name, email, password, role, bio, location) VALUES (?, ?, ?, ?, ?, ?)`,
            ['Admin User', adminEmail, adminPassword, 'admin', 'Platform administrator with a passion for technology and writing.', 'San Francisco, CA']
        );
        console.log('Admin user created');

        // Create demo user
        const demoPassword = await bcrypt.hash('demo123', 10);
        await connection.query(
            `INSERT IGNORE INTO users (name, email, password, role, bio, location) VALUES (?, ?, ?, ?, ?, ?)`,
            ['Demo User', 'demo@contentcraft.com', demoPassword, 'user', 'Passionate blogger and tech enthusiast. Love sharing knowledge with the community.', 'New York, USA']
        );
        console.log('Demo user created');

        // Get admin ID
        const [adminRows] = await connection.query('SELECT id FROM users WHERE role = ? LIMIT 1', ['admin']);
        if (adminRows.length === 0) {
            throw new Error('Admin user not found!');
        }
        const adminId = adminRows[0].id;

        // Create category map for reliable lookup
        const categoryMap = {};
        categoryCheck.forEach(cat => {
            categoryMap[cat.name] = cat.id;
        });

        // Insert demo blogs with proper formatting and images
        const demoBlogs = [
            {
                title: 'Getting Started with Node.js: A Complete Guide',
                description: 'Learn the fundamentals of Node.js and build your first server-side application with this comprehensive tutorial.',
                content: `<h2>Introduction to Node.js</h2>
                
                <p>Node.js has revolutionized the way we build web applications. It allows developers to use JavaScript on the server side, creating a unified language across the entire stack. This means you can use the same language for both frontend and backend development, making your development process more efficient and your codebase more maintainable.</p>
                
                <p>But what exactly is Node.js? At its core, Node.js is a JavaScript runtime built on Chrome's V8 JavaScript engine. It uses an event-driven, non-blocking I/O model that makes it lightweight and efficient, perfect for data-intensive real-time applications that run across distributed devices.</p>
                
                <h2>Why Choose Node.js?</h2>
                
                <p>Node.js offers several compelling advantages for modern web development:</p>
                
                <ul>
                    <li><strong>Non-blocking I/O operations</strong> - Node.js handles multiple requests simultaneously without waiting for file systems or databases to respond.</li>
                    <li><strong>Event-driven architecture</strong> - The event loop allows Node.js to perform non-blocking operations efficiently.</li>
                    <li><strong>Vast ecosystem of packages</strong> - npm (Node Package Manager) provides access to hundreds of thousands of reusable packages.</li>
                    <li><strong>Excellent performance</strong> - Built on Chrome's V8 engine, Node.js compiles JavaScript directly to machine code.</li>
                    <li><strong>Single language across stack</strong> - Use JavaScript for both client and server-side code.</li>
                </ul>
                
                <h2>Setting Up Your Development Environment</h2>
                
                <p>To get started with Node.js, you need to install it on your machine. Follow these steps:</p>
                
                <ol>
                    <li>Visit the official Node.js website (nodejs.org)</li>
                    <li>Download the LTS (Long Term Support) version for your operating system</li>
                    <li>Run the installer and follow the installation wizard</li>
                    <li>Verify the installation by opening a terminal and typing: <code>node --version</code></li>
                </ol>
                
                <p>Once installed, you'll also have access to npm (Node Package Manager), which you can verify with <code>npm --version</code>.</p>
                
                <h2>Building Your First Application</h2>
                
                <p>Let's create a simple HTTP server that responds with "Hello, World!" to any request. Create a new file called <code>server.js</code> and add the following code:</p>
                
                <pre><code>const http = require('http');

const server = http.createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Hello, World!');
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(\`Server running at http://localhost:\${PORT}/\`);
});</code></pre>
                
                <p>Save the file and run it with:</p>
                
                <pre><code>node server.js</code></pre>
                
                <p>Now open your browser and navigate to <code>http://localhost:3000</code>. You should see "Hello, World!" displayed in your browser.</p>
                
                <h2>Understanding the Code</h2>
                
                <p>Let's break down what's happening in this simple server:</p>
                
                <ul>
                    <li><code>require('http')</code> imports Node.js's built-in HTTP module</li>
                    <li><code>createServer()</code> creates a new HTTP server</li>
                    <li>The callback function handles incoming requests and sends responses</li>
                    <li><code>listen()</code> starts the server on the specified port</li>
                </ul>
                
                <h2>Next Steps</h2>
                
                <p>Now that you have a basic server running, you can expand your knowledge by learning about:</p>
                
                <ul>
                    <li><strong>Express.js</strong> - A popular web framework for Node.js</li>
                    <li><strong>Database integration</strong> - Connect to MongoDB, MySQL, or PostgreSQL</li>
                    <li><strong>RESTful APIs</strong> - Build robust APIs for your applications</li>
                    <li><strong>Authentication</strong> - Implement user login and registration</li>
                    <li><strong>Real-time applications</strong> - Use WebSockets with Socket.io</li>
                </ul>
                
                <h2>Conclusion</h2>
                
                <p>Node.js is a powerful tool for building scalable network applications. With its growing community and extensive package ecosystem, it's an excellent choice for modern web development. Whether you're building a simple API or a complex real-time application, Node.js provides the tools and performance you need.</p>
                
                <p>Remember to practice regularly and build projects to reinforce your learning. Happy coding!</p>`,
                category: 'Technology',
                image: 'nodejs-guide.jpg',
                is_featured: true
            },
            {
                title: 'Mastering CSS Grid Layout: A Comprehensive Guide',
                description: 'Create beautiful, responsive layouts with CSS Grid. From basics to advanced techniques for modern web design.',
                content: `<h2>What is CSS Grid?</h2>
                
                <p>CSS Grid Layout is a two-dimensional layout system for the web. It lets you lay out items in rows and columns, and has many features that make building complex layouts straightforward. Unlike Flexbox, which is primarily one-dimensional, Grid allows you to control both rows and columns simultaneously.</p>
                
                <p>Think of CSS Grid as a spreadsheet for your web layout. You define rows and columns, then place items into specific cells or span them across multiple cells. This level of control makes it possible to create complex layouts with minimal code.</p>
                
                <h2>Basic Concepts of CSS Grid</h2>
                
                <p>Before diving into code, let's understand the key concepts:</p>
                
                <ul>
                    <li><strong>Grid Container</strong> - The element that contains the grid</li>
                    <li><strong>Grid Items</strong> - The direct children of the grid container</li>
                    <li><strong>Grid Lines</strong> - The dividing lines that make up the grid structure</li>
                    <li><strong>Grid Tracks</strong> - The rows and columns between grid lines</li>
                    <li><strong>Grid Cells</strong> - The individual units of the grid</li>
                    <li><strong>Grid Areas</strong> - Rectangular areas spanning multiple cells</li>
                </ul>
                
                <h2>Creating Your First Grid</h2>
                
                <p>Let's start with a simple example. Create a container with three equal-width columns:</p>
                
                <pre><code>.container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    padding: 20px;
}

.item {
    background: #f0f0f0;
    padding: 20px;
    border-radius: 8px;
    text-align: center;
}</code></pre>
                
                <p>This creates a grid with three columns that each take up one fraction (1fr) of the available space, with a 20-pixel gap between items.</p>
                
                <h2>Understanding Grid Template Areas</h2>
                
                <p>Named grid areas make your layouts more readable and maintainable. Here's a classic header-sidebar-main-footer layout:</p>
                
                <pre><code>.container {
    display: grid;
    grid-template-areas:
        "header header header"
        "sidebar main main"
        "footer footer footer";
    grid-template-columns: 200px 1fr 1fr;
    grid-template-rows: auto 1fr auto;
    min-height: 100vh;
    gap: 20px;
}

.header { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main { grid-area: main; }
.footer { grid-area: footer; }</code></pre>
                
                <p>This approach makes it incredibly easy to understand and modify the layout structure just by changing the grid-template-areas.</p>
                
                <h2>Responsive Grids</h2>
                
                <p>CSS Grid works beautifully with media queries to create responsive designs that adapt to any screen size:</p>
                
                <pre><code>.container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
}

/* For smaller screens, we can change the layout */
@media (max-width: 768px) {
    .container {
        grid-template-columns: 1fr;
    }
}</code></pre>
                
                <p>The <code>auto-fit</code> and <code>minmax()</code> combination creates a responsive grid that automatically adjusts the number of columns based on available space.</p>
                
                <h2>Advanced Grid Techniques</h2>
                
                <p>Once you're comfortable with basics, explore these advanced features:</p>
                
                <h3>Grid Auto Flow</h3>
                
                <pre><code>.container {
    grid-auto-flow: dense; /* Fills holes in the grid */
    grid-auto-rows: minmax(100px, auto);
}</code></pre>
                
                <h3>Spanning Items</h3>
                
                <pre><code>.featured-item {
    grid-column: span 2;
    grid-row: span 2;
}</code></pre>
                
                <h3>Alignment and Justification</h3>
                
                <pre><code>.container {
    justify-items: center;  /* Horizontal alignment */
    align-items: center;     /* Vertical alignment */
    place-items: center;     /* Shorthand for both */
}</code></pre>
                
                <h2>Practical Examples</h2>
                
                <p>Here's a complete example of a modern card layout:</p>
                
                <pre><code>.card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 2rem;
}

.card {
    display: grid;
    grid-template-rows: auto 1fr auto;
    border: 1px solid #ddd;
    border-radius: 8px;
    overflow: hidden;
}

.card-image {
    width: 100%;
    height: 200px;
    object-fit: cover;
}

.card-content {
    padding: 1.5rem;
}

.card-footer {
    padding: 1rem 1.5rem;
    background: #f8f9fa;
    border-top: 1px solid #ddd;
}</code></pre>
                
                <h2>Conclusion</h2>
                
                <p>CSS Grid is a game-changer for web layout design. It simplifies complex layouts, reduces the need for nested elements, and provides better control over your designs. Start experimenting with these examples and you'll soon discover why Grid has become an essential tool for modern web development.</p>
                
                <p>Remember to check browser support - modern browsers have excellent Grid support, but always test your layouts across different browsers to ensure consistency.</p>`,
                category: 'Design',
                image: 'css-grid.jpg',
                is_featured: true
            },
            {
                title: 'The Future of Artificial Intelligence: Trends to Watch',
                description: 'Explore how AI is transforming industries and what the future holds for this revolutionary technology.',
                content: `<h2>The AI Revolution: Where We Stand Today</h2>
                
                <p>Artificial Intelligence is no longer science fiction. It's here, and it's transforming every industry imaginable at an unprecedented pace. From healthcare to finance, from education to entertainment, AI is reshaping how we work, live, and interact with the world around us.</p>
                
                <p>But what exactly makes this moment different from previous waves of technological change? The answer lies in the convergence of three key factors: massive amounts of data, unprecedented computing power, and breakthroughs in machine learning algorithms.</p>
                
                <h2>Current Applications Transforming Industries</h2>
                
                <p>Let's explore how AI is making significant impacts across various sectors:</p>
                
                <h3>Healthcare and Medicine</h3>
                
                <p>AI is revolutionizing healthcare in remarkable ways:</p>
                
                <ul>
                    <li><strong>Medical Diagnosis</strong> - AI systems can now detect diseases from medical images with accuracy matching or exceeding human experts. Google's AI can detect breast cancer from mammograms with fewer false positives than radiologists.</li>
                    <li><strong>Drug Discovery</strong> - Machine learning accelerates the drug discovery process by predicting how different compounds will interact with targets. This helped develop COVID-19 vaccines in record time.</li>
                    <li><strong>Personalized Treatment</strong> - AI analyzes patient data to recommend personalized treatment plans based on genetic profiles and medical history.</li>
                    <li><strong>Remote Patient Monitoring</strong> - AI-powered devices monitor patients' vital signs and alert healthcare providers to potential issues before they become emergencies.</li>
                </ul>
                
                <h3>Finance and Banking</h3>
                
                <p>The financial sector has embraced AI for:</p>
                
                <ul>
                    <li><strong>Fraud Detection</strong> - AI systems analyze transaction patterns in real-time to identify and prevent fraudulent activities.</li>
                    <li><strong>Algorithmic Trading</strong> - High-frequency trading systems use AI to make split-second decisions based on market data.</li>
                    <li><strong>Risk Assessment</strong> - Banks use AI to evaluate loan applications more accurately by analyzing thousands of data points.</li>
                    <li><strong>Customer Service</strong> - AI chatbots handle routine customer inquiries, freeing human agents for complex issues.</li>
                </ul>
                
                <h3>Transportation and Logistics</h3>
                
                <p>AI is driving innovation in how we move people and goods:</p>
                
                <ul>
                    <li><strong>Autonomous Vehicles</strong> - Companies like Tesla, Waymo, and Cruise are making self-driving cars a reality.</li>
                    <li><strong>Route Optimization</strong> - AI algorithms optimize delivery routes, saving fuel and reducing delivery times.</li>
                    <li><strong>Predictive Maintenance</strong> - AI predicts when vehicles and machinery need maintenance before they break down.</li>
                    <li><strong>Traffic Management</strong> - Smart cities use AI to optimize traffic flow and reduce congestion.</li>
                </ul>
                
                <h2>Machine Learning vs. Deep Learning: Understanding the Difference</h2>
                
                <p>Understanding the distinction between these AI subsets is crucial:</p>
                
                <h3>Machine Learning (ML)</h3>
                
                <p>Machine learning is a subset of AI where systems learn from data without being explicitly programmed. Traditional ML algorithms include:</p>
                
                <ul>
                    <li>Linear Regression for prediction</li>
                    <li>Decision Trees for classification</li>
                    <li>Random Forests for complex pattern recognition</li>
                    <li>Support Vector Machines for data classification</li>
                </ul>
                
                <h3>Deep Learning (DL)</h3>
                
                <p>Deep learning is a subset of machine learning inspired by the human brain's neural networks. It uses multiple layers to progressively extract higher-level features from raw input. Applications include:</p>
                
                <ul>
                    <li>Image and facial recognition</li>
                    <li>Natural language processing</li>
                    <li>Speech recognition</li>
                    <li>Autonomous driving perception</li>
                </ul>
                
                <h2>Ethical Considerations and Challenges</h2>
                
                <p>As AI becomes more powerful, we must address important ethical questions:</p>
                
                <h3>Privacy and Data Protection</h3>
                
                <p>AI systems require vast amounts of data, raising concerns about how personal information is collected, stored, and used. Regulations like GDPR attempt to address these concerns, but challenges remain.</p>
                
                <h3>Bias and Fairness</h3>
                
                <p>AI systems can inherit and amplify biases present in their training data. This has led to issues in hiring algorithms, facial recognition systems, and criminal justice applications. Addressing bias requires careful dataset curation and algorithmic transparency.</p>
                
                <h3>Job Displacement</h3>
                
                <p>While AI creates new jobs, it also automates existing ones. The challenge lies in retraining workers and creating new roles that leverage human creativity and emotional intelligence alongside AI capabilities.</p>
                
                <h3>Accountability and Transparency</h3>
                
                <p>When AI systems make decisions, who is accountable? The "black box" nature of some AI systems makes it difficult to understand how decisions are reached, creating challenges for regulation and oversight.</p>
                
                <h2>What's Next: Future Trends in AI</h2>
                
                <p>The future of AI includes several exciting developments:</p>
                
                <h3>General Artificial Intelligence (AGI)</h3>
                
                <p>AGI would have human-like cognitive abilities across any task, unlike current narrow AI systems. While still theoretical, progress in this area continues.</p>
                
                <h3>Quantum Machine Learning</h3>
                
                <p>Combining quantum computing with machine learning could solve problems currently impossible for classical computers, from drug discovery to climate modeling.</p>
                
                <h3>Edge AI</h3>
                
                <p>Running AI on edge devices (phones, cameras, IoT devices) rather than in the cloud will enable faster, more private, and more efficient AI applications.</p>
                
                <h3>Explainable AI (XAI)</h3>
                
                <p>As AI makes more critical decisions, the ability to explain those decisions becomes crucial. XAI aims to make AI decision-making transparent and understandable.</p>
                
                <h2>Preparing for an AI-Powered Future</h2>
                
                <p>To thrive in an AI-driven world:</p>
                
                <ul>
                    <li><strong>Develop AI literacy</strong> - Understand basic AI concepts and applications</li>
                    <li><strong>Focus on uniquely human skills</strong> - Creativity, emotional intelligence, and critical thinking become more valuable</li>
                    <li><strong>Stay informed</strong> - Follow AI developments and think about their implications</li>
                    <li><strong>Engage in the conversation</strong> - Participate in discussions about AI ethics and policy</li>
                </ul>
                
                <h2>Conclusion</h2>
                
                <p>Artificial Intelligence is not just another technological trend—it's a fundamental shift in how we approach problem-solving and innovation. By understanding its capabilities, limitations, and implications, we can harness AI's power while ensuring it benefits humanity as a whole.</p>
                
                <p>The future of AI is not predetermined. It will be shaped by the choices we make today—as developers, as businesses, and as a society. Let's make those choices wisely.</p>`,
                category: 'AI & Machine Learning',
                image: 'ai-future.jpg',
                is_featured: true
            }
        ];

        // Check if blogs already exist
        const [existingBlogs] = await connection.query('SELECT COUNT(*) as count FROM blogs');
        
        if (existingBlogs[0].count === 0) {
            let insertedCount = 0;
            
            for (const blog of demoBlogs) {
                const categoryId = categoryMap[blog.category];
                
                if (!categoryId) {
                    console.error(`Category '${blog.category}' not found for blog '${blog.title}'. Skipping...`);
                    continue;
                }

                try {
                    await connection.query(
                        `INSERT INTO blogs (title, description, content, image, author_id, category_id, is_published, is_featured, published_at, views) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
                        [
                            blog.title, 
                            blog.description, 
                            blog.content, 
                            blog.image, 
                            adminId, 
                            categoryId, 
                            true,
                            blog.is_featured,
                            Math.floor(Math.random() * 500) + 10
                        ]
                    );
                    insertedCount++;
                    console.log(`Inserted: ${blog.title}`);
                } catch (insertErr) {
                    console.error(`Failed to insert '${blog.title}':`, insertErr.message);
                }
            }
            
            console.log(`${insertedCount}/${demoBlogs.length} demo blogs inserted successfully`);
        } else {
            console.log('Demo blogs already exist, skipping...');
        }

        // Insert default site settings
        const defaultSettings = [
            ['contact_email', 'support@contentcraft.com'],
            ['contact_address', '123 Innovation Avenue, Tech City, TC 54321'],
            ['contact_phone', '+1 (555) 987-6543'],
            ['contact_maps_url', 'https://maps.google.com/?q=123+Innovation+Avenue+Tech+City'],
            ['about_mission', 'ContentCraft was created with a simple mission: to provide a platform where anyone can share their stories, ideas, and expertise with the world. We believe that everyone has something valuable to say, and we are here to help you say it.'],
            ['about_vision', 'To become the world\'s most inclusive and innovative content platform, empowering millions of creators to share their voices and connect with global audiences.'],
            ['about_story', 'Founded in 2024, ContentCraft started as a small project by a group of passionate writers and developers who wanted to create a better platform for content creators. Today, we are proud to host thousands of blogs across countless topics, serving millions of readers worldwide.'],
            ['social_facebook', 'https://facebook.com/contentcraft'],
            ['social_twitter', 'https://twitter.com/contentcraft'],
            ['social_instagram', 'https://instagram.com/contentcraft'],
            ['social_linkedin', 'https://linkedin.com/company/contentcraft'],
            ['site_name', 'ContentCraft'],
            ['site_description', 'A modern platform for creators to share their stories with the world'],
            ['site_keywords', 'blogging, content creation, writing, publishing, community']
        ];

        for (const [key, value] of defaultSettings) {
            await connection.query(
                'INSERT IGNORE INTO site_settings (setting_key, setting_value) VALUES (?, ?)',
                [key, value]
            );
        }
        console.log('Default site settings inserted');

        // Insert sample FAQs
        const sampleFaqs = [
            ['How do I create a blog?', 'To create a blog, you need to have an account. Once logged in, navigate to your dashboard and click on "Create New Blog". Fill in the title, description, content, and select a category. You can also upload a featured image to make your blog more attractive.', 'general', 1],
            ['Can I edit my blog after publishing?', 'Yes, you can edit your blogs anytime. Go to your dashboard, find the blog you want to edit, and click the edit button. Remember to save your changes after editing.', 'general', 2],
            ['How do I change my profile picture?', 'Click on your avatar in the navigation bar, go to Profile, and click the camera icon on your avatar to upload a new image. Supported formats: JPG, PNG, GIF up to 5MB.', 'account', 3],
            ['Is there a mobile app?', 'Currently, ContentCraft is optimized for mobile browsers. We are working on native mobile apps for iOS and Android - stay tuned for updates!', 'technical', 4],
            ['How do I report inappropriate content?', 'If you find content that violates our guidelines, please use the "Report" button on the blog post or contact our support team directly.', 'general', 5],
            ['Can I delete my account?', 'Yes, you can delete your account from the Profile settings. Note that this action is permanent and will remove all your blogs and comments.', 'account', 6]
        ];

        const [existingFaqs] = await connection.query('SELECT COUNT(*) as count FROM faqs');
        if (existingFaqs[0].count === 0) {
            for (const [question, answer, category, order] of sampleFaqs) {
                await connection.query(
                    'INSERT INTO faqs (question, answer, category, display_order) VALUES (?, ?, ?, ?)',
                    [question, answer, category, order]
                );
            }
            console.log('Sample FAQs inserted');
        }

        // Final verification
        console.log('\nFINAL VERIFICATION:');
        
        const [blogCount] = await connection.query('SELECT COUNT(*) as count FROM blogs');
        const [publishedBlogs] = await connection.query(`
            SELECT b.id, b.title, b.is_published, b.is_featured, b.published_at, c.name as category 
            FROM blogs b 
            LEFT JOIN categories c ON b.category_id = c.id 
            LIMIT 5
        `);
        
        console.log(`   Total blogs in database: ${blogCount[0].count}`);
        console.log('   Sample blogs:');
        publishedBlogs.forEach(b => {
            console.log(`     - ${b.title} (${b.category}) | Featured: ${b.is_featured}`);
        });

        console.log('\nDatabase initialization completed successfully!');
        console.log('\nDefault Credentials:');
        console.log(`   Admin: ${adminEmail} / ${process.env.ADMIN_PASSWORD || 'admin123'}`);
        console.log('   Demo User: demo@contentcraft.com / demo123');

    } catch (error) {
        console.error('Database initialization failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Connection closed');
        }
    }
};

// Run initialization
initDatabase();