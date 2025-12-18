// e2e/rocket-bingo.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Rocket Bingo E2E Game Flow', () => {
  test('Complete Host and Player Game Loop', async ({ browser }) => {
    // Create two browser contexts to simulate two players
    const hostContext = await browser.newContext();
    const playerContext = await browser.newContext();
    
    const hostPage = await hostContext.newPage();
    const playerPage = await playerContext.newPage();

    try {
      // Step 1: Host creates a room
      console.log('🎮 Host creating a room...');
      await hostPage.goto('http://localhost:3000');
      
      // Wait for the page to load
      await expect(hostPage.locator('h1')).toContainText('🚀 Rocket Bingo');
      
      // Click Host Game button
      await hostPage.click('text=🚀 Host Game');
      
      // Enter host name
      await hostPage.keyboard.type('HostPlayer');
      await hostPage.keyboard.press('Enter');
      
      // Wait for lobby to load
      await expect(hostPage.locator('text=Game Lobby')).toBeVisible();
      
      // Get room ID from URL
      const hostUrl = hostPage.url();
      const roomId = new URL(hostUrl).searchParams.get('room') || 'ROOM_ID_NOT_FOUND';
      console.log(`🏠 Host room created with ID: ${roomId}`);
      
      // Verify game mode selector shows both options
      await expect(hostPage.locator('select')).toContainText('Classic Bingo');
      await expect(hostPage.locator('select')).toContainText('Business Buzzwords');
      
      // Step 2: Player joins the room
      console.log('🎯 Player joining the room...');
      await playerPage.goto(`http://localhost:3000?room=${roomId}`);
      
      // Should redirect to join page
      await expect(playerPage.locator('h1')).toContainText('🚀 Rocket Bingo');
      await expect(playerPage.locator('text=Join an existing game')).toBeVisible();
      
      // Fill in player name and join
      await playerPage.fill('[placeholder*="Enter your name"]', 'PlayerOne');
      await playerPage.click('text=Join Room');
      
      // Wait for player to join lobby
      await expect(playerPage.locator('text=Waiting Room')).toBeVisible();
      
      // Step 3: Host starts the game
      console.log('🚀 Host starting the game...');
      await hostPage.click('text=🚀 Start Game');
      
      // Wait for game to start on both pages
      await expect(hostPage.locator('text=Your Bingo Card')).toBeVisible();
      await expect(playerPage.locator('text=Your Bingo Card')).toBeVisible();
      
      console.log('✅ Game started successfully!');
      
      // Step 4: Verify both players see the game board
      await expect(hostPage.locator('.grid.grid-cols-5')).toBeVisible();
      await expect(playerPage.locator('.grid.grid-cols-5')).toBeVisible();
      
      // Step 5: Verify game mode is properly set
      const gameModeText = await hostPage.locator('select').textContent();
      if (gameModeText?.includes('Business Buzzwords')) {
        console.log('🎯 Testing Business mode...');
        // Verify business jargon is being used (we should see business terms in the board)
        await expect(hostPage.locator('.grid.grid-cols-5')).toContainText('Circle back');
        await expect(playerPage.locator('.grid.grid-cols-5')).toContainText('Circle back');
      } else {
        console.log('🎲 Testing Classic mode...');
        // Verify classic numbers are being used
        await expect(hostPage.locator('.grid.grid-cols-5')).toContainText('1');
        await expect(playerPage.locator('.grid.grid-cols-5')).toContainText('1');
      }
      
      // Step 6: Test cell interaction (mark some cells)
      console.log('🎯 Testing cell interactions...');
      
      // Host marks first few cells
      const hostCells = hostPage.locator('.grid.grid-cols-5 >> button').filter({ hasNotText: 'FREE' });
      await hostCells.first().click();
      await hostCells.nth(1).click();
      await hostCells.nth(2).click();
      
      // Player marks some cells
      const playerCells = playerPage.locator('.grid.grid-cols-5 >> button').filter({ hasNotText: 'FREE' });
      await playerCells.nth(3).click();
      await playerCells.nth(4).click();
      await playerCells.nth(5).click();
      
      // Wait for visual updates
      await hostPage.waitForTimeout(1000);
      await playerPage.waitForTimeout(1000);
      
      // Step 7: Test BINGO call functionality
      console.log('🎉 Testing BINGO call...');
      
      // Host tries to call BINGO (should work if they have a line)
      await hostPage.click('text=Call BINGO!');
      
      // Wait for potential win message or validation
      await hostPage.waitForTimeout(2000);
      
      // Verify the BINGO button is still clickable (game should handle validation)
      await expect(hostPage.locator('text=Call BINGO!')).toBeVisible();
      
      // Step 8: Verify game stats and status
      console.log('📊 Verifying game statistics...');
      
      // Check if marked cell count is displayed
      const hostMarkedCount = await hostPage.locator('text=Marked:').count();
      const playerMarkedCount = await playerPage.locator('text=Marked:').count();
      
      if (hostMarkedCount > 0) {
        console.log('✅ Host marked cells are tracked');
      }
      
      if (playerMarkedCount > 0) {
        console.log('✅ Player marked cells are tracked');
      }
      
      // Step 9: Test room info display
      console.log('🏠 Verifying room information...');
      
      // Both players should see the room ID
      await expect(hostPage.locator(`text=${roomId}`)).toBeVisible();
      await expect(playerPage.locator(`text=${roomId}`)).toBeVisible();
      
      // Both should show 2 players
      await expect(hostPage.locator('text=Players:')).toContainText('2');
      await expect(playerPage.locator('text=Players:')).toContainText('2');
      
      // Step 10: Test responsive design elements
      console.log('📱 Testing responsive elements...');
      
      // Check if the glass morphism effects are applied
      const hostCards = await hostPage.locator('.glass-card').count();
      const playerCards = await playerPage.locator('.glass-card').count();
      
      if (hostCards > 0 && playerCards > 0) {
        console.log('✅ Glass morphism styling applied correctly');
      }
      
      console.log('🎊 E2E Test Completed Successfully!');
      
    } catch (error) {
      console.error('❌ E2E Test Failed:', error);
      throw error;
    } finally {
      // Clean up browser contexts
      await hostContext.close();
      await playerContext.close();
    }
  });

  test('Game Mode Selection and Business Mode Content', async ({ page }) => {
    console.log('🎯 Testing Game Mode Selection...');
    
    await page.goto('http://localhost:3000');
    
    // Test switching between game modes
    await page.selectOption('select', 'BUSINESS');
    await expect(page.locator('select')).toHaveValue('BUSINESS');
    
    await page.selectOption('select', 'CLASSIC');
    await expect(page.locator('select')).toHaveValue('CLASSIC');
    
    // Create room with Business mode
    await page.selectOption('select', 'BUSINESS');
    await page.click('text=🚀 Host Game');
    await page.keyboard.type('BusinessTester');
    await page.keyboard.press('Enter');
    
    // Wait for lobby and verify business mode is active
    await expect(page.locator('text=Business Buzzwords')).toBeVisible();
    
    console.log('✅ Game mode selection working correctly');
  });

  test('Real-time Synchronization', async ({ browser }) => {
    console.log('🔄 Testing real-time synchronization...');
    
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    try {
      // Create room with first player
      await page1.goto('http://localhost:3000');
      await page1.click('text=🚀 Host Game');
      await page1.keyboard.type('Player1');
      await page1.keyboard.press('Enter');
      
      const url = page1.url();
      const roomId = new URL(url).searchParams.get('room');
      
      // Second player joins
      await page2.goto(`http://localhost:3000?room=${roomId}`);
      await page2.click('text=🎮 Join Game');
      await page2.fill('[placeholder*="Enter your name"]', 'Player2');
      await page2.click('text=Join Room');
      
      // Verify both are in lobby
      await expect(page1.locator('text=Players (2)')).toBeVisible();
      await expect(page2.locator('text=Players (2)')).toBeVisible();
      
      // Start game
      await page1.click('text=🚀 Start Game');
      
      // Wait for both to reach game state
      await expect(page1.locator('text=Your Bingo Card')).toBeVisible();
      await expect(page2.locator('text=Your Bingo Card')).toBeVisible();
      
      // Test that game state is synchronized
      await expect(page1.locator('text=Status:')).toContainText('started');
      await expect(page2.locator('text=Status:')).toContainText('started');
      
      console.log('✅ Real-time synchronization working correctly');
      
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});