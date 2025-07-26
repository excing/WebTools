/**
 * Firestore API 测试脚本
 * 用于验证 Firestore API 端点是否正常工作
 */

const BASE_URL = 'http://localhost:3200/api/firestore';

async function testAPI(endpoint, options = {}) {
  try {
    console.log(`\n🧪 测试: ${options.method || 'GET'} ${endpoint}`);
    
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ 成功:', result.data || result);
    } else {
      console.log('❌ 失败:', result.error);
    }
    
    return result;
  } catch (error) {
    console.log('💥 错误:', error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 开始测试 Firestore API...\n');

  // 1. 测试获取集合列表
  await testAPI('/collections');

  // 2. 测试创建集合
  await testAPI('/collections', {
    method: 'POST',
    body: JSON.stringify({
      collectionName: 'test_collection',
      documentData: {
        name: '测试文档',
        value: 123,
        timestamp: new Date().toISOString()
      }
    })
  });

  // 3. 再次获取集合列表（应该包含新创建的集合）
  await testAPI('/collections');

  // 4. 测试获取文档列表
  await testAPI('/documents?collection=test_collection&limit=5');

  // 5. 测试创建文档
  await testAPI('/documents', {
    method: 'POST',
    body: JSON.stringify({
      collection: 'test_collection',
      data: {
        title: '新文档',
        content: '这是一个测试文档',
        tags: ['test', 'api'],
        count: 42
      }
    })
  });

  // 6. 测试查询
  await testAPI('/query', {
    method: 'POST',
    body: JSON.stringify({
      collection: 'test_collection',
      where: [
        {
          field: 'count',
          operator: '>',
          value: 0
        }
      ],
      orderBy: [
        {
          field: 'createdAt',
          direction: 'desc'
        }
      ],
      limit: 10
    })
  });

  // 7. 测试聚合查询
  await testAPI('/query?type=aggregate&collection=test_collection&operation=count');

  // 8. 测试批量操作
  await testAPI('/batch', {
    method: 'POST',
    body: JSON.stringify({
      operations: [
        {
          type: 'create',
          collection: 'test_collection',
          data: {
            name: '批量文档1',
            value: 100
          }
        },
        {
          type: 'create',
          collection: 'test_collection',
          data: {
            name: '批量文档2',
            value: 200
          }
        }
      ]
    })
  });

  console.log('\n🎉 测试完成！');
}

// 运行测试
runTests().catch(console.error);
