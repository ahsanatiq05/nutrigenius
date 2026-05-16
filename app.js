document.addEventListener('DOMContentLoaded', () => {
    // ---- Toast Notifications ----
    function showToast(message) {
        const toast = document.getElementById('toast');
        const toastMsg = document.getElementById('toast-msg');
        toastMsg.textContent = message;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 3000);
    }

    // ---- Food Scanner (Image Upload) ----
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const scanResult = document.getElementById('scan-result');
    const scanData = document.getElementById('scan-data');

    // Drag and Drop Events
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            handleImageUpload(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleImageUpload(e.target.files[0]);
        }
    });

    function handleImageUpload(file) {
        if (!file.type.startsWith('image/')) {
            showToast('Please upload an image file.');
            return;
        }

        scanResult.classList.remove('hidden');
        scanData.innerHTML = `<p style="color: var(--accent-color)">Analyzing image with AI...</p>`;

        const formData = new FormData();
        formData.append('image', file);

        fetch('/api/scan', {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) throw new Error(data.error);
            scanData.innerHTML = `<p>${data.analysis}</p>`;
            showToast('Scan complete!');
        })
        .catch(err => {
            console.error(err);
            scanData.innerHTML = `<p style="color: #ff3b3b;">Error: Could not analyze image. Are you sure the backend is running?</p>`;
            // Fallback mock data if backend fails
            setTimeout(() => {
                scanData.innerHTML = `
                    <div style="margin-top: 10px;">
                        <p><strong>Item:</strong> Grilled Chicken Salad (Mock)</p>
                        <p><strong>Calories:</strong> 320 kcal</p>
                        <p><strong>Protein:</strong> 35g | <strong>Carbs:</strong> 12g | <strong>Fat:</strong> 14g</p>
                    </div>
                `;
                showToast('Used mock data (Backend not responding).');
            }, 2000);
        });
    }

    // ---- Water Intake Tracker ----
    const waterBar = document.getElementById('water-bar');
    const waterText = document.getElementById('water-text-large');
    let waterGlasses = parseInt(localStorage.getItem('waterGlasses')) || 0;
    const maxGlasses = 8;

    function updateWaterUI() {
        const percentage = Math.min((waterGlasses / maxGlasses) * 100, 100);
        waterBar.style.width = `${percentage}%`;
        waterText.textContent = waterGlasses;
        localStorage.setItem('waterGlasses', waterGlasses);
        
        // Also update backend if we want
        fetch('/api/water', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ glasses: waterGlasses })
        }).catch(e => console.log('Backend water sync failed'));
    }

    // Load initial from backend
    fetch('/api/water')
        .then(res => res.json())
        .then(data => {
            if(data.glasses !== undefined) {
                waterGlasses = data.glasses;
                updateWaterUI();
            }
        }).catch(e => updateWaterUI());

    document.getElementById('add-water-btn').addEventListener('click', () => {
        if (waterGlasses < maxGlasses) {
            waterGlasses++;
            updateWaterUI();
            if (waterGlasses === maxGlasses) showToast('Daily water goal reached! 🎉');
        } else {
            showToast('You already reached your goal! 💧');
        }
    });

    document.getElementById('reset-water-btn').addEventListener('click', () => {
        waterGlasses = 0;
        updateWaterUI();
        showToast('Water tracker reset.');
    });

    // Reminders
    let reminderInterval;
    document.getElementById('water-reminders').addEventListener('change', (e) => {
        if (e.target.checked) {
            showToast('2-hour hydration reminders enabled.');
            // Simulate 2 hours with 20 seconds for demo purposes
            reminderInterval = setInterval(() => {
                showToast('💧 Time to drink a glass of water!');
            }, 20000); 
        } else {
            showToast('Reminders disabled.');
            clearInterval(reminderInterval);
        }
    });

    // ---- Recipe Generator ----
    document.getElementById('generate-recipe-btn').addEventListener('click', () => {
        const prompt = document.getElementById('recipe-prompt').value.trim();
        if (!prompt) {
            showToast('Please enter a recipe idea.');
            return;
        }

        const recipeResult = document.getElementById('recipe-result');
        recipeResult.classList.remove('hidden');
        recipeResult.innerHTML = '<p style="color: var(--accent-color)">Generating recipe with AI...</p>';

        fetch('/api/recipe', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ prompt })
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) throw new Error(data.error);
            recipeResult.innerHTML = `<div style="margin-top: 15px; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 10px;">${data.recipe}</div>`;
            showToast('Recipe generated!');
        })
        .catch(err => {
            console.error(err);
            // Mock response
            setTimeout(() => {
                recipeResult.innerHTML = `
                    <div style="margin-top: 15px; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 10px;">
                        <h4>Mock Recipe: ${prompt}</h4>
                        <p><strong>Ingredients:</strong></p>
                        <ul><li>1 cup mock ingredient</li><li>2 tbsp mock sauce</li></ul>
                        <p><strong>Instructions:</strong></p>
                        <ol><li>Mix ingredients.</li><li>Cook for 10 mins.</li></ol>
                    </div>
                `;
            }, 1500);
        });
    });

    // ---- AI Assistant ----
    const chatLogContainer = document.getElementById('chat-log-container');
    const chatLog = document.getElementById('chat-log');
    const aiInput = document.getElementById('ai-input');
    const closeChatBtn = document.getElementById('close-chat-btn');

    aiInput.addEventListener('focus', () => {
        chatLogContainer.classList.remove('hidden');
    });

    closeChatBtn.addEventListener('click', () => {
        chatLogContainer.classList.add('hidden');
    });

    function appendMessage(role, text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${role}`;
        msgDiv.innerHTML = `<div class="msg-content">${text}</div>`;
        chatLog.appendChild(msgDiv);
        chatLog.scrollTop = chatLog.scrollHeight;
    }

    document.getElementById('ai-send-btn').addEventListener('click', () => {
        const query = aiInput.value.trim();
        if (!query) return;

        aiInput.value = '';
        chatLogContainer.classList.remove('hidden');
        appendMessage('user', query);
        
        // Add loading indicator
        const loadingId = 'loading-' + Date.now();
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'chat-message ai';
        loadingDiv.id = loadingId;
        loadingDiv.innerHTML = `<div class="msg-content" style="opacity:0.6;">Thinking...</div>`;
        chatLog.appendChild(loadingDiv);
        chatLog.scrollTop = chatLog.scrollHeight;

        fetch('/api/chat', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ message: query })
        })
        .then(res => res.json())
        .then(data => {
            document.getElementById(loadingId).remove();
            if (data.error) throw new Error(data.error);
            appendMessage('ai', data.response);
        })
        .catch(err => {
            document.getElementById(loadingId).remove();
            appendMessage('ai', 'I am experiencing some network delays, please try again later.');
        });
    });
    
    // Trigger on Enter key
    aiInput.addEventListener('keypress', (e) => {
        if(e.key === 'Enter') document.getElementById('ai-send-btn').click();
    });

    // ---- Nav Links Dummy Interactions ----
    document.querySelectorAll('nav a, .sidebar a').forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.getAttribute('href') === '#') {
                e.preventDefault();
                showToast('Navigating to ' + link.textContent.trim());
                document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
                if(link.closest('nav')) link.classList.add('active');
            }
        });
    });

    // ---- Calendar Interactions ----
    const days = document.querySelectorAll('.calendar .day');
    const consumedCalories = document.getElementById('consumed-calories');
    
    days.forEach(day => {
        day.addEventListener('click', () => {
            days.forEach(d => {
                d.classList.remove('active');
                const dot = d.querySelector('.dot');
                if(dot) dot.remove();
                if(d.querySelector('span').innerHTML === '') {
                    d.querySelector('span').innerHTML = '--';
                }
            });
            day.classList.add('active');
            
            // Add dot to the active day
            const span = day.querySelector('span');
            span.innerHTML = '<span class="dot"></span>';
            
            // Randomize consumed calories
            const randomCals = Math.floor(Math.random() * 1500) + 800;
            if(consumedCalories) {
                consumedCalories.textContent = `${randomCals.toLocaleString()} kcal`;
            }
            showToast(`Viewing plan for ${day.querySelector('strong').textContent}`);
        });
    });

    // Add Meal Button
    const addMealBtn = document.querySelector('.btn-ghost');
    if (addMealBtn) {
        addMealBtn.addEventListener('click', () => {
            const mealName = prompt("What meal did you just have? (e.g. Avocado Toast)");
            if(mealName) {
                const calInput = prompt(`How many calories were in the ${mealName}? (Leave blank for AI estimate)`);
                let addedCals;
                
                if(calInput && !isNaN(parseInt(calInput))) {
                    addedCals = parseInt(calInput);
                } else {
                    addedCals = Math.floor(Math.random() * 400) + 200; // AI estimate
                }
                
                if(consumedCalories) {
                    const currentCals = parseInt(consumedCalories.textContent.replace(/,/g, ''));
                    consumedCalories.textContent = `${(currentCals + addedCals).toLocaleString()} kcal`;
                }
                showToast(`Added ${mealName} (${addedCals} kcal) to today's plan!`);
            }
        });
    }
});
