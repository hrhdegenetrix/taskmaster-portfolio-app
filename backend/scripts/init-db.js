const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initializeDatabase() {
  try {
    console.log('🔄 Initializing TaskMaster database...');

    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected successfully!');

    // Create sample categories if none exist
    const categoryCount = await prisma.category.count();
    if (categoryCount === 0) {
      console.log('📁 Creating sample categories...');
      
      await prisma.category.createMany({
        data: [
          {
            name: 'Work',
            description: 'Professional tasks and projects',
            color: '#3B82F6',
            icon: '💼'
          },
          {
            name: 'Personal',
            description: 'Personal tasks and errands',
            color: '#10B981',
            icon: '🏠'
          },
          {
            name: 'Learning',
            description: 'Educational and skill development',
            color: '#8B5CF6',
            icon: '📚'
          },
          {
            name: 'Health',
            description: 'Health and fitness related tasks',
            color: '#EF4444',
            icon: '🏥'
          }
        ]
      });
      console.log('✅ Sample categories created!');
    }

    // Create sample tags if none exist
    const tagCount = await prisma.tag.count();
    if (tagCount === 0) {
      console.log('🏷️ Creating sample tags...');
      
      await prisma.tag.createMany({
        data: [
          { name: 'urgent', color: '#EF4444' },
          { name: 'important', color: '#F59E0B' },
          { name: 'quick', color: '#10B981' },
          { name: 'research', color: '#6366F1' },
          { name: 'meeting', color: '#8B5CF6' },
          { name: 'creative', color: '#EC4899' }
        ]
      });
      console.log('✅ Sample tags created!');
    }

    // Create a welcome task if no tasks exist
    const taskCount = await prisma.task.count();
    if (taskCount === 0) {
      console.log('📋 Creating welcome task...');
      
      const workCategory = await prisma.category.findFirst({
        where: { name: 'Work' }
      });

      await prisma.task.create({
        data: {
          title: 'Welcome to TaskMaster! 🎉',
          description: 'This is your first task! You can edit or delete this task and start creating your own. **TaskMaster** supports markdown in descriptions!',
          priority: 'MEDIUM',
          status: 'PENDING',
          categoryId: workCategory?.id,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        }
      });
      console.log('✅ Welcome task created!');
    }

    console.log('🎉 Database initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = { initializeDatabase };

// Run if called directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('✅ Database setup complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database setup failed:', error);
      process.exit(1);
    });
} 