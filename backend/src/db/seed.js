const bcrypt = require('bcrypt');
const { query, testConnection } = require('../config/database');
const logger = require('../utils/logger');
const config = require('../config/app');

/**
 * Database seeding utility for populating the library with initial data
 */
class Seeder {
  constructor() {
    this.users = [];
    this.categories = [];
    this.books = [];
  }

  /**
   * Main seeding function
   */
  async seed() {
    try {
      await testConnection();
      logger.info('Starting database seeding...');

      // Clear existing data
      await this.clearData();

      // Seed data in order (respecting foreign keys)
      await this.seedUsers();
      await this.seedCategories();
      await this.seedBooks();
      await this.seedBookCategories();

      logger.info('Database seeding completed successfully');
    } catch (error) {
      logger.error('Seed failed:', error);
      throw error;
    }
  }

  /**
   * Clear existing data
   */
  async clearData() {
    logger.info('Clearing existing data...');
    
    // Disable foreign key checks temporarily
    await query('SET session_replication_role = replica');
    
    // Clear tables in reverse dependency order
    await query('TRUNCATE TABLE book_categories RESTART IDENTITY CASCADE');
    await query('TRUNCATE TABLE book_loans RESTART IDENTITY CASCADE');
    await query('TRUNCATE TABLE books RESTART IDENTITY CASCADE');
    await query('TRUNCATE TABLE categories RESTART IDENTITY CASCADE');
    await query('TRUNCATE TABLE users RESTART IDENTITY CASCADE');
    
    // Re-enable foreign key checks
    await query('SET session_replication_role = DEFAULT');
    
    logger.info('Existing data cleared');
  }

  /**
   * Seed users
   */
  async seedUsers() {
    logger.info('Seeding users...');

    const usersData = [
      {
        email: 'librarian@library.com',
        password: 'LibPass123!',
        first_name: 'Library',
        last_name: 'Administrator',
        role: 'librarian',
        max_books_allowed: 50
      },
      {
        email: 'member@library.com',
        password: 'MemPass123!',
        first_name: 'John',
        last_name: 'Doe',
        role: 'member',
        max_books_allowed: 10
      },
      {
        email: 'aikaterini.chavela@library.com',
        password: 'AikaPass123!',
        first_name: 'Aikaterini',
        last_name: 'Chavela',
        role: 'member',
        max_books_allowed: 15
      },
      {
        email: 'jane.smith@library.com',
        password: 'JanePass123!',
        first_name: 'Jane',
        last_name: 'Smith',
        role: 'member',
        max_books_allowed: 10
      },
      {
        email: 'alex.johnson@library.com',
        password: 'AlexPass123!',
        first_name: 'Alex',
        last_name: 'Johnson',
        role: 'member',
        max_books_allowed: 10
      }
    ];

    for (const userData of usersData) {
      const password_hash = await bcrypt.hash(userData.password, config.bcrypt.saltRounds);
      
      const result = await query(`
        INSERT INTO users (email, password_hash, first_name, last_name, role, max_books_allowed)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, email, role
      `, [
        userData.email,
        password_hash,
        userData.first_name,
        userData.last_name,
        userData.role,
        userData.max_books_allowed
      ]);

      this.users.push(result.rows[0]);
      logger.info(`Created user: ${userData.email} (${userData.role})`);
    }
  }

  /**
   * Seed categories
   */
  async seedCategories() {
    logger.info('Seeding categories...');

    const categoriesData = [
      {
        name: 'Web Development',
        description: 'Books about web technologies, frameworks, and development practices'
      },
      {
        name: 'Programming Languages',
        description: 'Books covering various programming languages and their concepts'
      },
      {
        name: 'Software Engineering',
        description: 'Books about software design, architecture, and engineering practices'
      },
      {
        name: 'Data Science',
        description: 'Books about data analysis, machine learning, and statistical methods'
      },
      {
        name: 'DevOps & Cloud',
        description: 'Books about DevOps practices, cloud computing, and infrastructure'
      },
      {
        name: 'Mobile Development',
        description: 'Books about mobile app development for various platforms'
      },
      {
        name: 'Database Systems',
        description: 'Books about database design, management, and optimization'
      },
      {
        name: 'Cybersecurity',
        description: 'Books about information security, ethical hacking, and cybersecurity'
      },
      {
        name: 'Artificial Intelligence',
        description: 'Books about AI, machine learning, and deep learning'
      }
    ];

    for (const categoryData of categoriesData) {
      const result = await query(`
        INSERT INTO categories (name, description)
        VALUES ($1, $2)
        RETURNING id, name
      `, [categoryData.name, categoryData.description]);

      this.categories.push(result.rows[0]);
      logger.info(`Created category: ${categoryData.name}`);
    }
  }

  /**
   * Seed books
   */
  async seedBooks() {
    logger.info('Seeding books...');

    const booksData = [
      {
        isbn: '978-0596517748',
        title: 'JavaScript: The Good Parts',
        author: 'Douglas Crockford',
        publisher: 'O\'Reilly Media',
        publication_year: 2008,
        description: 'A deep dive into the JavaScript language, focusing on the good parts while avoiding the pitfalls. Essential reading for any JavaScript developer.',
        total_copies: 3,
        available_copies: 2,
        categories: ['Web Development', 'Programming Languages']
      },
      {
        isbn: '978-0134494166',
        title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
        author: 'Robert C. Martin',
        publisher: 'Prentice Hall',
        publication_year: 2008,
        description: 'Learn how to write clean, maintainable code that can be read and enhanced by other developers. A must-read for professional programmers.',
        total_copies: 5,
        available_copies: 4,
        categories: ['Software Engineering', 'Programming Languages']
      },
      {
        isbn: '978-0321125215',
        title: 'Domain-Driven Design: Tackling Complexity in the Heart of Software',
        author: 'Eric Evans',
        publisher: 'Addison-Wesley Professional',
        publication_year: 2003,
        description: 'A comprehensive guide to domain-driven design, providing practical techniques for modeling complex software systems.',
        total_copies: 2,
        available_copies: 2,
        categories: ['Software Engineering']
      },
      {
        isbn: '978-1449355739',
        title: 'Designing Data-Intensive Applications',
        author: 'Martin Kleppmann',
        publisher: 'O\'Reilly Media',
        publication_year: 2017,
        description: 'Navigate the diverse landscape of technologies for processing and storing data in modern applications. Essential for backend developers.',
        total_copies: 4,
        available_copies: 3,
        categories: ['Database Systems', 'Software Engineering']
      },
      {
        isbn: '978-0135957059',
        title: 'The Pragmatic Programmer: Your Journey To Mastery',
        author: 'David Thomas, Andrew Hunt',
        publisher: 'Addison-Wesley Professional',
        publication_year: 2019,
        description: 'Timeless advice for becoming a better programmer. Updated for the modern developer with new examples and practices.',
        total_copies: 4,
        available_copies: 4,
        categories: ['Software Engineering', 'Programming Languages']
      },
      {
        isbn: '978-1491950296',
        title: 'Python for Data Analysis',
        author: 'Wes McKinney',
        publisher: 'O\'Reilly Media',
        publication_year: 2017,
        description: 'Complete guide to data analysis with Python using pandas, NumPy, and other essential libraries.',
        total_copies: 3,
        available_copies: 2,
        categories: ['Data Science', 'Programming Languages']
      },
      {
        isbn: '978-1617294136',
        title: 'Spring Boot in Action',
        author: 'Craig Walls',
        publisher: 'Manning Publications',
        publication_year: 2015,
        description: 'Learn to build microservices and web applications with Spring Boot, the popular Java framework.',
        total_copies: 2,
        available_copies: 1,
        categories: ['Web Development', 'Programming Languages']
      },
      {
        isbn: '978-1449331818',
        title: 'Learning React: Functional Web Development with React and Redux',
        author: 'Alex Banks, Eve Porcello',
        publisher: 'O\'Reilly Media',
        publication_year: 2017,
        description: 'Master React and Redux for building modern web applications with a functional programming approach.',
        total_copies: 4,
        available_copies: 3,
        categories: ['Web Development', 'Programming Languages']
      },
      {
        isbn: '978-0134685991',
        title: 'Effective Java',
        author: 'Joshua Bloch',
        publisher: 'Addison-Wesley Professional',
        publication_year: 2017,
        description: 'Best practices for the Java programming language from one of its principal architects. Third edition with Java 7, 8, and 9 features.',
        total_copies: 3,
        available_copies: 3,
        categories: ['Programming Languages', 'Software Engineering']
      },
      {
        isbn: '978-1491904244',
        title: 'You Don\'t Know JS: Scope & Closures',
        author: 'Kyle Simpson',
        publisher: 'O\'Reilly Media',
        publication_year: 2014,
        description: 'Deep dive into JavaScript scope and closures, fundamental concepts that every JS developer must understand.',
        total_copies: 2,
        available_copies: 1,
        categories: ['Web Development', 'Programming Languages']
      },
      {
        isbn: '978-1617295584',
        title: 'Docker in Action',
        author: 'Jeff Nickoloff, Stephen Kuenzli',
        publisher: 'Manning Publications',
        publication_year: 2019,
        description: 'Learn Docker from the ground up, including container orchestration and production deployment strategies.',
        total_copies: 3,
        available_copies: 2,
        categories: ['DevOps & Cloud', 'Software Engineering']
      },
      {
        isbn: '978-1491974051',
        title: 'Kubernetes: Up and Running',
        author: 'Kelsey Hightower, Brendan Burns, Joe Beda',
        publisher: 'O\'Reilly Media',
        publication_year: 2019,
        description: 'Comprehensive guide to Kubernetes, the container orchestration platform that\'s transforming how applications are deployed.',
        total_copies: 2,
        available_copies: 2,
        categories: ['DevOps & Cloud', 'Software Engineering']
      },
      {
        isbn: '978-1449373320',
        title: 'Designing Web APIs',
        author: 'Brenda Jin, Saurabh Sahni, Amir Shevat',
        publisher: 'O\'Reilly Media',
        publication_year: 2018,
        description: 'Learn how to design robust, scalable APIs that developers love to use. Covers REST, GraphQL, and more.',
        total_copies: 3,
        available_copies: 3,
        categories: ['Web Development', 'Software Engineering']
      },
      {
        isbn: '978-0134757599',
        title: 'Refactoring: Improving the Design of Existing Code',
        author: 'Martin Fowler',
        publisher: 'Addison-Wesley Professional',
        publication_year: 2018,
        description: 'Updated classic on refactoring with new examples in JavaScript. Learn how to improve code structure without changing functionality.',
        total_copies: 3,
        available_copies: 2,
        categories: ['Software Engineering', 'Programming Languages']
      },
      {
        isbn: '978-1491903063',
        title: 'High Performance MySQL',
        author: 'Baron Schwartz, Peter Zaitsev, Vadim Tkachenko',
        publisher: 'O\'Reilly Media',
        publication_year: 2012,
        description: 'Advanced techniques for optimizing MySQL performance, from query optimization to hardware considerations.',
        total_copies: 2,
        available_copies: 2,
        categories: ['Database Systems']
      },
      {
        isbn: '978-1617295102',
        title: 'The Well-Grounded Rubyist',
        author: 'David A. Black, Joseph Leo III',
        publisher: 'Manning Publications',
        publication_year: 2019,
        description: 'Master Ruby programming from basics to advanced topics. Perfect for developers wanting to deepen their Ruby knowledge.',
        total_copies: 2,
        available_copies: 2,
        categories: ['Programming Languages', 'Web Development']
      },
      {
        isbn: '978-1449367084',
        title: 'MongoDB: The Definitive Guide',
        author: 'Kristina Chodorow',
        publisher: 'O\'Reilly Media',
        publication_year: 2013,
        description: 'Complete guide to MongoDB, covering everything from basic operations to advanced features like sharding and replication.',
        total_copies: 2,
        available_copies: 1,
        categories: ['Database Systems']
      },
      {
        isbn: '978-1491950357',
        title: 'Building Microservices',
        author: 'Sam Newman',
        publisher: 'O\'Reilly Media',
        publication_year: 2015,
        description: 'Learn how to design and build microservices architecture. Covers patterns, practices, and pitfalls of distributed systems.',
        total_copies: 3,
        available_copies: 2,
        categories: ['Software Engineering', 'DevOps & Cloud']
      },
      {
        isbn: '978-1593277574',
        title: 'Black Hat Python: Python Programming for Hackers and Pentesters',
        author: 'Justin Seitz',
        publisher: 'No Starch Press',
        publication_year: 2014,
        description: 'Learn Python programming through the lens of cybersecurity and penetration testing. Practical examples included.',
        total_copies: 2,
        available_copies: 2,
        categories: ['Cybersecurity', 'Programming Languages']
      },
      {
        isbn: '978-1491924464',
        title: 'Hands-On Machine Learning with Scikit-Learn and TensorFlow',
        author: 'Aurélien Géron',
        publisher: 'O\'Reilly Media',
        publication_year: 2017,
        description: 'Practical guide to machine learning using Python. Covers both traditional ML algorithms and deep learning with TensorFlow.',
        total_copies: 4,
        available_copies: 3,
        categories: ['Artificial Intelligence', 'Data Science', 'Programming Languages']
      },
      {
        isbn: '978-1617294433',
        title: 'React Native in Action',
        author: 'Nader Dabit',
        publisher: 'Manning Publications',
        publication_year: 2019,
        description: 'Build native mobile apps using React Native. Learn to create cross-platform applications with JavaScript.',
        total_copies: 2,
        available_copies: 2,
        categories: ['Mobile Development', 'Web Development']
      },
      {
        isbn: '978-1484242094',
        title: 'Flutter Complete Reference',
        author: 'Alberto Miola',
        publisher: 'Apress',
        publication_year: 2021,
        description: 'Comprehensive guide to Flutter development. Learn to build beautiful native applications for mobile, web, and desktop.',
        total_copies: 2,
        available_copies: 1,
        categories: ['Mobile Development']
      },
      {
        isbn: '978-1491947272',
        title: 'Site Reliability Engineering',
        author: 'Niall Richard Murphy, Betsy Beyer, Chris Jones, Jennifer Petoff',
        publisher: 'O\'Reilly Media',
        publication_year: 2016,
        description: 'Learn how Google runs production systems. Essential reading for anyone involved in maintaining large-scale systems.',
        total_copies: 3,
        available_copies: 3,
        categories: ['DevOps & Cloud', 'Software Engineering']
      },
      {
        isbn: '978-1449373320',
        title: 'Deep Learning',
        author: 'Ian Goodfellow, Yoshua Bengio, Aaron Courville',
        publisher: 'MIT Press',
        publication_year: 2016,
        description: 'Comprehensive textbook on deep learning, covering mathematical foundations and practical applications.',
        total_copies: 2,
        available_copies: 2,
        categories: ['Artificial Intelligence', 'Data Science']
      }
    ];

    for (const bookData of booksData) {
      const result = await query(`
        INSERT INTO books (isbn, title, author, publisher, publication_year, description, total_copies, available_copies, cover_image_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, title, isbn
      `, [
        bookData.isbn,
        bookData.title,
        bookData.author,
        bookData.publisher,
        bookData.publication_year,
        bookData.description,
        bookData.total_copies,
        bookData.available_copies,
        `https://covers.openlibrary.org/b/isbn/${bookData.isbn.replace(/[-\s]/g, '')}-L.jpg`
      ]);

      this.books.push({
        ...result.rows[0],
        categories: bookData.categories
      });

      logger.info(`Created book: ${bookData.title}`);
    }
  }

  /**
   * Seed book categories (junction table)
   */
  async seedBookCategories() {
    logger.info('Seeding book categories...');

    for (const book of this.books) {
      for (const categoryName of book.categories) {
        const category = this.categories.find(c => c.name === categoryName);
        if (category) {
          await query(`
            INSERT INTO book_categories (book_id, category_id)
            VALUES ($1, $2)
            ON CONFLICT (book_id, category_id) DO NOTHING
          `, [book.id, category.id]);
        }
      }
      logger.info(`Added categories for: ${book.title}`);
    }
  }

  /**
   * Get seeding summary
   */
  async getSummary() {
    const stats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM categories) as categories,
        (SELECT COUNT(*) FROM books) as books,
        (SELECT COUNT(*) FROM book_categories) as book_category_associations
    `);

    return stats.rows[0];
  }
}

// CLI usage
if (require.main === module) {
  const seeder = new Seeder();
  
  seeder.seed()
    .then(async () => {
      const summary = await seeder.getSummary();
      console.log('\nSeeding Summary:');
      console.log(`Users: ${summary.users}`);
      console.log(`Categories: ${summary.categories}`);
      console.log(`Books: ${summary.books}`);
      console.log(`Book-Category Associations: ${summary.book_category_associations}`);
      console.log('\nDatabase seeded successfully!');
      console.log('\nTest Accounts:');
      console.log('Librarian: librarian@library.com / LibPass123!');
      console.log('Member: member@library.com / MemPass123!');
      console.log('Aikaterini: aikaterini.chavela@library.com / AikaPass123!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('ERROR: Seeding failed:', error.message);
      process.exit(1);
    });
}

module.exports = Seeder;