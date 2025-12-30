class CharismaApp {
    constructor() {
        this.currentModule = 0;
        this.userProfile = {};
        this.trainingModules = [];
        this.currentUser = null;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.isRecording = false;
        this.userProgress = {
            completedModules: [],
            timeSpent: {},
            confidenceScore: 60,
            streak: 0,
            lastPractice: null,
            achievements: [],
            gameScores: {}
        };
        this.currentGame = null;
        this.gameScore = 0;
        this.init();
    }

    init() {
        // Add small delay to ensure DOM is loaded
        setTimeout(() => {
            const loginForm = document.getElementById('login-form');
            const registerForm = document.getElementById('register-form');
            const assessmentForm = document.getElementById('assessment-form');
            
            if (loginForm) {
                loginForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleLogin();
                });
            }
            
            if (registerForm) {
                registerForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleRegister();
                });
            }
            
            if (assessmentForm) {
                assessmentForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.processAssessment();
                });
            }
        }, 100);
    }

    async handleRegister() {
        console.log('Register function called'); // Debug log
        const formData = new FormData(document.getElementById('register-form'));
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        
        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }
        
        const userData = {
            name: formData.get('name'),
            email: formData.get('email'),
            password: password
        };
        
        console.log('User data:', userData); // Debug log
        
        // Always work in offline mode for simplicity
        this.currentUser = { ...userData, id: Date.now() };
        localStorage.setItem('charisma_user', JSON.stringify(this.currentUser));
        this.showUserInfo();
        alert('Account created successfully!');
        this.showSection('assessment-section');
    }

    async handleLogin() {
        const formData = new FormData(document.getElementById('login-form'));
        const email = formData.get('email');
        const password = formData.get('password');
        
        console.log('Login attempt:', email); // Debug
        
        // Check localStorage first (offline mode)
        const savedUser = localStorage.getItem('charisma_user');
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                if (user.email === email && user.password === password) {
                    this.currentUser = user;
                    if (user.progress) {
                        this.userProgress = { ...this.userProgress, ...user.progress };
                    }
                    this.showUserInfo();
                    if (user.profile) {
                        this.userProfile = user.profile;
                        this.generateTrainingPlan();
                        this.showResults();
                    } else {
                        this.showSection('assessment-section');
                    }
                    return;
                }
            } catch (error) {
                console.log('Error parsing saved user:', error);
            }
        }
        
        // If no saved user or wrong credentials, create new user for demo
        this.currentUser = { email, password, id: Date.now() };
        localStorage.setItem('charisma_user', JSON.stringify(this.currentUser));
        this.showUserInfo();
        this.showSection('assessment-section');
    }

    async processAssessment() {
        const formData = new FormData(document.getElementById('assessment-form'));
        this.userProfile = {
            comfort: formData.get('comfort'),
            personality: formData.get('personality'),
            inspiration: formData.get('inspiration')
        };

        // Save profile to current user
        this.currentUser.profile = this.userProfile;
        
        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: this.currentUser.email,
                    profile: this.userProfile
                })
            });
        } catch (error) {
            // Save offline
            localStorage.setItem('charisma_user', JSON.stringify(this.currentUser));
        }

        this.generateTrainingPlan();
        this.showResults();
    }

    generateTrainingPlan() {
        const modules = {
            'very-uncomfortable': [
                { 
                    title: 'Breathing & Anxiety Control', 
                    content: 'Master deep breathing techniques to calm nerves before speaking.',
                    practiceText: 'I am calm and confident. My voice is strong and clear. I breathe deeply and speak with purpose.',
                    phrases: [
                        'Good morning, everyone. Thank you for being here.',
                        'I appreciate your time and attention today.',
                        'Let me share something important with you.',
                        'I believe we can achieve great things together.'
                    ],
                    gameScenarios: [
                        {
                            situation: "You're opening a team meeting",
                            dialog: [
                                { speaker: "You", text: "___", options: ["Good morning, everyone. Thank you for being here.", "Hey guys, let's start.", "Um, hi everyone."] },
                                { speaker: "Team Member", text: "Good morning! We're excited to hear your updates." },
                                { speaker: "You", text: "___", options: ["I appreciate your time and attention today.", "Okay, so...", "Right, well..."] }
                            ]
                        }
                    ]
                },
                { 
                    title: 'Body Language Basics', 
                    content: 'Learn confident posture and gestures.',
                    practiceText: 'Stand tall, shoulders back, feet firmly planted. Make eye contact and speak with conviction.',
                    phrases: [
                        'I stand here with confidence and purpose.',
                        'My presence commands respect and attention.',
                        'I communicate clearly and effectively.',
                        'Every word I speak has meaning and impact.'
                    ],
                    gameScenarios: [
                        {
                            situation: "You're presenting to executives",
                            dialog: [
                                { speaker: "Executive", text: "Please tell us about your proposal." },
                                { speaker: "You", text: "___", options: ["I stand here with confidence and purpose.", "Well, I think maybe...", "So, um, my idea is..."] },
                                { speaker: "Executive", text: "That's a strong opening. Continue." },
                                { speaker: "You", text: "___", options: ["Every word I speak has meaning and impact.", "I guess what I'm trying to say is...", "Hopefully this makes sense..."] }
                            ]
                        }
                    ]
                }
            ],
            'uncomfortable': [
                { 
                    title: 'Voice Projection', 
                    content: 'Develop a strong, clear speaking voice.',
                    practiceText: 'Project your voice from your diaphragm. Speak slowly and clearly. Let each word resonate with authority.',
                    phrases: [
                        'I speak with clarity and conviction.',
                        'My voice carries authority and warmth.',
                        'I command attention through my presence.',
                        'Every presentation is an opportunity to inspire.'
                    ]
                },
                { 
                    title: 'Eye Contact Mastery', 
                    content: 'Connect with your audience through confident eye contact.',
                    practiceText: 'Look directly at your audience. Hold eye contact for 3-5 seconds with different people. Your eyes convey confidence.',
                    phrases: [
                        'I connect with each person in this room.',
                        'My message resonates because I believe in it.',
                        'I see the potential in every face before me.',
                        'Together, we will accomplish extraordinary things.'
                    ]
                }
            ],
            'neutral': [
                { 
                    title: 'Storytelling Techniques', 
                    content: 'Engage audiences with compelling narratives.',
                    practiceText: 'Let me tell you about a time when everything changed. It was a moment that taught me the power of perseverance and vision.',
                    phrases: [
                        'This reminds me of a story that changed everything.',
                        'Picture this scenario with me for a moment.',
                        'The lesson here is both simple and profound.',
                        'What happened next surprised everyone, including me.'
                    ]
                },
                { 
                    title: 'Persuasion Strategies', 
                    content: 'Influence and motivate through strategic communication.',
                    practiceText: 'The data is clear, the opportunity is real, and the time is now. We have three compelling reasons to move forward.',
                    phrases: [
                        'The evidence overwhelmingly supports this direction.',
                        'I invite you to consider the possibilities.',
                        'The return on investment speaks for itself.',
                        'This is our moment to lead the industry.'
                    ]
                }
            ],
            'comfortable': [
                { 
                    title: 'Executive Presence', 
                    content: 'Command the room with CEO-level authority.',
                    practiceText: 'As leaders, we must make difficult decisions with incomplete information. Our responsibility is to our stakeholders, our team, and our future.',
                    phrases: [
                        'The strategic imperative is crystal clear.',
                        'We will execute with precision and purpose.',
                        'This decision reflects our core values.',
                        'I take full responsibility for our success.'
                    ]
                },
                { 
                    title: 'Crisis Communication', 
                    content: 'Handle difficult questions and situations.',
                    practiceText: 'I understand your concerns, and I want to address them directly. Here are the facts, here is our plan, and here is how we move forward.',
                    phrases: [
                        'Let me address that concern directly.',
                        'I appreciate the challenging question.',
                        'Here\'s what we know and what we\'re doing about it.',
                        'Transparency and accountability guide our response.'
                    ]
                }
            ],
            'very-comfortable': [
                { 
                    title: 'Thought Leadership', 
                    content: 'Position yourself as an industry visionary.',
                    practiceText: 'The future belongs to those who can see beyond today\'s limitations. We are not just adapting to change; we are creating it.',
                    phrases: [
                        'The paradigm is shifting, and we\'re leading it.',
                        'Innovation requires courage and conviction.',
                        'We don\'t follow trends; we create them.',
                        'The future starts with the decisions we make today.'
                    ]
                },
                { 
                    title: 'Media Training', 
                    content: 'Excel in interviews and public appearances.',
                    practiceText: 'Thank you for having me. I\'m excited to share our vision and discuss how we\'re transforming the industry through innovation and leadership.',
                    phrases: [
                        'I\'m delighted to be here with you today.',
                        'That\'s an excellent question that gets to the heart of it.',
                        'Let me put this in perspective for your audience.',
                        'The key takeaway I want to leave you with is this.'
                    ]
                }
            ]
        };

        const inspirationStyles = {
            'obama': { focus: 'Thoughtful pauses and inspiring rhetoric', exercises: ['Pause practice', 'Hope-based messaging'] },
            'oprah': { focus: 'Emotional connection and authenticity', exercises: ['Vulnerability practice', 'Empathy building'] },
            'jobs': { focus: 'Simplicity and vision casting', exercises: ['One-thing focus', 'Future painting'] },
            'bezos': { focus: 'Data-driven arguments and long-term thinking', exercises: ['Metric storytelling', 'Vision articulation'] }
        };

        this.trainingModules = modules[this.userProfile.comfort] || modules['neutral'];
        this.inspirationStyle = inspirationStyles[this.userProfile.inspiration];
    }

    showResults() {
        const resultDiv = document.getElementById('personality-result');
        const modulesDiv = document.getElementById('training-modules');

        resultDiv.innerHTML = `
            <h3>Your Profile</h3>
            <span class="personality-badge">${this.userProfile.personality.toUpperCase()}</span>
            <span class="personality-badge">${this.userProfile.comfort.replace('-', ' ').toUpperCase()}</span>
            <p><strong>Inspiration Style:</strong> ${this.inspirationStyle.focus}</p>
        `;

        modulesDiv.innerHTML = this.trainingModules.map((module, index) => {
            const isCompleted = this.userProgress.completedModules.includes(index);
            const completedIcon = isCompleted ? '✅' : '⭕';
            const timeSpent = this.userProgress.timeSpent[index] || 0;
            
            return `
                <div class="module-card ${isCompleted ? 'completed' : ''}">
                    <h4>${completedIcon} Module ${index + 1}: ${module.title}</h4>
                    <p>${module.content}</p>
                    ${timeSpent > 0 ? `<small>Time spent: ${Math.round(timeSpent/60)}min</small>` : ''}
                </div>
            `;
        }).join('');

        this.showSection('results-section');
    }

    startTraining() {
        this.currentModule = 0;
        this.loadModule();
        this.showSection('training-section');
    }

    loadModule() {
        const module = this.trainingModules[this.currentModule];
        const moduleDiv = document.getElementById('current-module');
        this.moduleStartTime = Date.now();
        
        moduleDiv.innerHTML = `
            <h3>Module ${this.currentModule + 1}: ${module.title}</h3>
            <div class="module-card">
                <p>${module.content}</p>
                <h4>Inspired by ${this.userProfile.inspiration.charAt(0).toUpperCase() + this.userProfile.inspiration.slice(1)}:</h4>
                <p><em>${this.inspirationStyle.focus}</em></p>
                
                <div class="practice-section">
                    <h4>📖 Practice Text (Read Aloud):</h4>
                    <div class="practice-text">
                        "${module.practiceText}"
                        <button onclick="speakText('${module.practiceText.replace(/'/g, "\\'")}')">🔊 Listen</button>
                    </div>
                    
                    <h4>💪 Confidence Phrases:</h4>
                    <ul class="phrases-list">
                        ${module.phrases.map(phrase => `
                            <li>
                                "${phrase}"
                                <button onclick="speakText('${phrase.replace(/'/g, "\\'")}')">🔊</button>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                
                <div class="feedback-section">
                    <h4>📊 Real-time Feedback:</h4>
                    <div class="feedback-meters">
                        <div class="meter">
                            <label>Pace:</label>
                            <div class="meter-bar"><div id="pace-meter" class="meter-fill"></div></div>
                            <span id="pace-value">Normal</span>
                        </div>
                        <div class="meter">
                            <label>Volume:</label>
                            <div class="meter-bar"><div id="volume-meter" class="meter-fill"></div></div>
                            <span id="volume-value">Good</span>
                        </div>
                        <div class="meter">
                            <label>Confidence:</label>
                            <div class="meter-bar"><div id="confidence-meter" class="meter-fill" style="width: ${this.userProgress.confidenceScore}%"></div></div>
                            <span id="confidence-value">${this.userProgress.confidenceScore}%</span>
                        </div>
                    </div>
                </div>
                
                <h4>Practice Exercises:</h4>
                <ul>
                    ${this.inspirationStyle.exercises.map(ex => `<li>${ex}</li>`).join('')}
                </ul>
                
                <div class="game-controls">
                    <button onclick="startDialogGame()" class="game-btn">🎮 Start Dialog Game</button>
                </div>
            </div>
        `;
        
        this.loadDialogGame();
    }

    nextModule() {
        if (this.currentModule < this.trainingModules.length - 1) {
            this.currentModule++;
            this.loadModule();
        }
    }

    previousModule() {
        if (this.currentModule > 0) {
            this.currentModule--;
            this.loadModule();
        }
    }

    async toggleRecording() {
        if (!this.isRecording) {
            await this.startRecording();
        } else {
            this.stopRecording();
        }
    }

    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.recordedChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                this.uploadRecording();
            };

            this.mediaRecorder.start();
            this.isRecording = true;
            
            document.getElementById('record-btn').textContent = 'Stop Recording';
            document.getElementById('record-btn').classList.add('recording');
            document.getElementById('recording-status').textContent = 'Recording...';
        } catch (error) {
            console.error('Recording error:', error);
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            
            document.getElementById('record-btn').textContent = 'Start Recording';
            document.getElementById('record-btn').classList.remove('recording');
            document.getElementById('recording-status').textContent = 'Processing...';
        }
    }

    async uploadRecording() {
        const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', blob, 'recording.webm');
        formData.append('userId', this.currentUser.id);
        formData.append('moduleId', this.currentModule);

        try {
            const response = await fetch('/api/recordings', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            this.displayAnalysis(result.analysis);
        } catch (error) {
            console.error('Upload error:', error);
        }
    }

    displayAnalysis(analysis) {
        const resultsDiv = document.getElementById('analysis-results');
        resultsDiv.innerHTML = `
            <div class="analysis-card">
                <h4>Speech Analysis</h4>
                <p><strong>Duration:</strong> ${analysis.duration.toFixed(1)}s</p>
                <p><strong>Pace:</strong> ${analysis.pace.toFixed(0)} words/min</p>
                <p><strong>Confidence:</strong> ${analysis.confidence.toFixed(0)}%</p>
                <p><strong>Clarity:</strong> ${analysis.clarity.toFixed(0)}%</p>
            </div>
        `;
        document.getElementById('recording-status').textContent = 'Analysis complete!';
    }

    async completeModule() {
        // Track time spent
        if (this.moduleStartTime) {
            const timeSpent = Date.now() - this.moduleStartTime;
            this.userProgress.timeSpent[this.currentModule] = (this.userProgress.timeSpent[this.currentModule] || 0) + timeSpent;
        }
        
        // Mark as completed
        if (!this.userProgress.completedModules.includes(this.currentModule)) {
            this.userProgress.completedModules.push(this.currentModule);
            this.userProgress.confidenceScore += 5;
            this.checkAchievements();
        }
        
        // Update streak
        const today = new Date().toDateString();
        if (this.userProgress.lastPractice !== today) {
            this.userProgress.streak += 1;
            this.userProgress.lastPractice = today;
        }
        
        this.saveProgress();
        
        try {
            await fetch('/api/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: this.currentUser.id,
                    moduleId: this.currentModule,
                    completed: true,
                    score: this.userProgress.confidenceScore,
                    notes: 'Module completed'
                })
            });
        } catch (error) {
            console.log('Offline mode - progress saved locally');
        }
        
        this.showAchievementPopup();
        alert(`Module completed! Confidence: ${this.userProgress.confidenceScore}% | Streak: ${this.userProgress.streak} days`);
    }

    async showProgress() {
        try {
            const response = await fetch(`/api/progress/${this.currentUser.id}`);
            const progress = await response.json();
            
            const recordingsResponse = await fetch(`/api/recordings/${this.currentUser.id}`);
            const recordings = await recordingsResponse.json();
            
            this.displayProgress(progress, recordings);
            this.showSection('progress-section');
        } catch (error) {
            console.error('Progress fetch error:', error);
        }
    }

    displayProgress(progress, recordings) {
        const progressDiv = document.getElementById('progress-chart');
        const recordingsDiv = document.getElementById('recordings-history');
        
        const completedModules = progress.filter(p => p.completed).length;
        const totalModules = this.trainingModules.length;
        const progressPercent = (completedModules / totalModules) * 100;
        
        progressDiv.innerHTML = `
            <h3>Training Progress</h3>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progressPercent}%"></div>
            </div>
            <p>${completedModules} of ${totalModules} modules completed (${progressPercent.toFixed(0)}%)</p>
        `;
        
        recordingsDiv.innerHTML = `
            <h3>Recent Recordings</h3>
            ${recordings.slice(0, 3).map(r => `
                <div class="analysis-card">
                    <p><strong>Module ${r.module_id + 1}</strong> - ${new Date(r.created_at).toLocaleDateString()}</p>
                    <p>Confidence: ${r.analysis.confidence.toFixed(0)}% | Clarity: ${r.analysis.clarity.toFixed(0)}%</p>
                </div>
            `).join('')}
        `;
    }

    showTraining() {
        this.showSection('training-section');
        this.loadModule();
    }
    showUserInfo() {
        if (this.currentUser) {
            const userInfo = document.getElementById('user-info');
            const welcomeText = document.getElementById('welcome-text');
            const userName = this.currentUser.name || this.currentUser.email.split('@')[0];
            
            welcomeText.textContent = `Welcome, ${userName}!`;
            userInfo.style.display = 'flex';
        }
    }

    logout() {
        this.currentUser = null;
        this.userProfile = {};
        this.trainingModules = [];
        this.currentModule = 0;
        
        // Hide user info
        document.getElementById('user-info').style.display = 'none';
        
        // Clear forms
        document.getElementById('login-form').reset();
        document.getElementById('register-form').reset();
        
        // Show login section
        this.showSection('login-section');
        showLogin(); // Reset to login tab
        
        alert('Logged out successfully!');
    }

    showSection(sectionId) {
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionId).classList.add('active');
        
        // Start real-time feedback when entering training
        if (sectionId === 'training-section') {
            setTimeout(() => this.startRealTimeFeedback(), 1000);
        }
    }

    checkAchievements() {
        const achievements = [];
        
        if (this.userProgress.completedModules.length === 1 && !this.userProgress.achievements.includes('first_module')) {
            achievements.push({ id: 'first_module', title: '🎯 First Steps', desc: 'Completed your first module!' });
        }
        
        if (this.userProgress.completedModules.length === 3 && !this.userProgress.achievements.includes('three_modules')) {
            achievements.push({ id: 'three_modules', title: '🚀 Getting Confident', desc: 'Completed 3 modules!' });
        }
        
        if (this.userProgress.streak >= 3 && !this.userProgress.achievements.includes('streak_3')) {
            achievements.push({ id: 'streak_3', title: '🔥 On Fire', desc: '3-day practice streak!' });
        }
        
        if (this.userProgress.confidenceScore >= 80 && !this.userProgress.achievements.includes('confident')) {
            achievements.push({ id: 'confident', title: '💪 Confident Speaker', desc: 'Reached 80% confidence!' });
        }
        
        achievements.forEach(achievement => {
            this.userProgress.achievements.push(achievement.id);
        });
        
        return achievements;
    }

    showAchievementPopup() {
        const newAchievements = this.checkAchievements();
        if (newAchievements.length > 0) {
            const popup = document.createElement('div');
            popup.className = 'achievement-popup';
            popup.innerHTML = `
                <div class="achievement-content">
                    <h3>🎉 Achievement Unlocked!</h3>
                    ${newAchievements.map(a => `
                        <div class="achievement-item">
                            <h4>${a.title}</h4>
                            <p>${a.desc}</p>
                        </div>
                    `).join('')}
                    <button onclick="this.parentElement.parentElement.remove()">Awesome!</button>
                </div>
            `;
            document.body.appendChild(popup);
            
            setTimeout(() => {
                if (popup.parentElement) popup.remove();
            }, 5000);
        }
    }

    saveProgress() {
        if (this.currentUser) {
            this.currentUser.progress = this.userProgress;
            localStorage.setItem('charisma_user', JSON.stringify(this.currentUser));
        }
    }

    loadProgress() {
        if (this.currentUser && this.currentUser.progress) {
            this.userProgress = { ...this.userProgress, ...this.currentUser.progress };
        }
    }

    speakText(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.8;
            utterance.pitch = 1;
            speechSynthesis.speak(utterance);
        }
    }

    startRealTimeFeedback() {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const analyser = audioContext.createAnalyser();
                    const microphone = audioContext.createMediaStreamSource(stream);
                    microphone.connect(analyser);
                    
                    analyser.fftSize = 256;
                    const bufferLength = analyser.frequencyBinCount;
                    const dataArray = new Uint8Array(bufferLength);
                    
                    const updateMeters = () => {
                        analyser.getByteFrequencyData(dataArray);
                        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
                        
                        // Update volume meter
                        const volumePercent = Math.min((average / 128) * 100, 100);
                        document.getElementById('volume-meter').style.width = volumePercent + '%';
                        document.getElementById('volume-value').textContent = 
                            volumePercent > 60 ? 'Good' : volumePercent > 30 ? 'Low' : 'Too Quiet';
                        
                        requestAnimationFrame(updateMeters);
                    };
                    
                    updateMeters();
                })
                .catch(err => console.log('Microphone access denied'));
        }
    }

    loadDialogGame() {
        const module = this.trainingModules[this.currentModule];
        if (!module.gameScenarios) return;
        
        this.currentGame = module.gameScenarios[0];
        this.gameScore = 0;
        
        const gameDiv = document.getElementById('dialog-game');
        gameDiv.innerHTML = `
            <div class="game-intro">
                <p><strong>Scenario:</strong> ${this.currentGame.situation}</p>
                <p>Choose the most confident responses to complete the dialog!</p>
            </div>
        `;
    }

    startDialogGame() {
        if (!this.currentGame) return;
        
        this.gameScore = 0;
        this.currentDialogStep = 0;
        this.showDialogStep();
    }

    showDialogStep() {
        const step = this.currentGame.dialog[this.currentDialogStep];
        const gameDiv = document.getElementById('dialog-game');
        
        if (step.speaker === "You" && step.options) {
            gameDiv.innerHTML = `
                <div class="dialog-step">
                    <div class="dialog-context">
                        ${this.currentGame.dialog.slice(0, this.currentDialogStep).map(d => 
                            `<p><strong>${d.speaker}:</strong> ${d.text.replace('___', '[Your response]')}</p>`
                        ).join('')}
                    </div>
                    <div class="current-dialog">
                        <p><strong>Your turn:</strong></p>
                        <div class="dialog-options">
                            ${step.options.map((option, index) => `
                                <button class="dialog-option" onclick="selectDialogOption(${index})">${option}</button>
                            `).join('')}
                        </div>
                    </div>
                    <div class="game-progress">
                        Step ${this.currentDialogStep + 1} of ${this.currentGame.dialog.length} | Score: ${this.gameScore}
                    </div>
                </div>
            `;
        } else {
            // Show other speaker's response
            gameDiv.innerHTML = `
                <div class="dialog-step">
                    <div class="dialog-context">
                        ${this.currentGame.dialog.slice(0, this.currentDialogStep + 1).map(d => 
                            `<p><strong>${d.speaker}:</strong> ${d.text}</p>`
                        ).join('')}
                    </div>
                    <button onclick="nextDialogStep()" class="continue-btn">Continue</button>
                </div>
            `;
        }
    }

    selectDialogOption(optionIndex) {
        const step = this.currentGame.dialog[this.currentDialogStep];
        const selectedOption = step.options[optionIndex];
        
        // Score based on confidence level (first option is usually most confident)
        const score = optionIndex === 0 ? 10 : optionIndex === 1 ? 5 : 0;
        this.gameScore += score;
        
        // Update dialog with selected option
        this.currentGame.dialog[this.currentDialogStep].text = selectedOption;
        
        // Show feedback
        const feedback = optionIndex === 0 ? "Excellent choice! Very confident." : 
                        optionIndex === 1 ? "Good choice, but could be more assertive." : 
                        "Consider a more confident approach.";
        
        document.getElementById('dialog-game').innerHTML = `
            <div class="dialog-feedback">
                <p><strong>You chose:</strong> "${selectedOption}"</p>
                <p class="feedback ${optionIndex === 0 ? 'excellent' : optionIndex === 1 ? 'good' : 'needs-work'}">${feedback}</p>
                <p><strong>Points earned:</strong> ${score}</p>
                <button onclick="nextDialogStep()" class="continue-btn">Continue</button>
            </div>
        `;
    }

    nextDialogStep() {
        this.currentDialogStep++;
        
        if (this.currentDialogStep >= this.currentGame.dialog.length) {
            this.endDialogGame();
        } else {
            this.showDialogStep();
        }
    }

    endDialogGame() {
        const maxScore = this.currentGame.dialog.filter(d => d.options).length * 10;
        const percentage = Math.round((this.gameScore / maxScore) * 100);
        
        // Save game score
        this.userProgress.gameScores[this.currentModule] = this.gameScore;
        this.saveProgress();
        
        // Show results
        document.getElementById('dialog-game').innerHTML = `
            <div class="game-results">
                <h4>🎉 Dialog Complete!</h4>
                <div class="score-display">
                    <p><strong>Final Score:</strong> ${this.gameScore}/${maxScore} (${percentage}%)</p>
                    <div class="score-bar">
                        <div class="score-fill" style="width: ${percentage}%"></div>
                    </div>
                </div>
                <div class="performance-feedback">
                    ${percentage >= 80 ? "🌟 Outstanding! You speak with true CEO confidence!" :
                      percentage >= 60 ? "👍 Great job! You're developing strong leadership presence." :
                      percentage >= 40 ? "📈 Good progress! Keep practicing confident responses." :
                      "💪 Keep practicing! Confidence grows with repetition."}
                </div>
                <button onclick="startDialogGame()" class="play-again-btn">Play Again</button>
            </div>
        `;
        
        // Update confidence score
        if (percentage >= 80) {
            this.userProgress.confidenceScore += 3;
        } else if (percentage >= 60) {
            this.userProgress.confidenceScore += 2;
        } else if (percentage >= 40) {
            this.userProgress.confidenceScore += 1;
        }
    }
}

// Initialize app
const app = new CharismaApp();

// Global functions for button clicks
function startTraining() {
    app.startTraining();
}

function nextModule() {
    app.nextModule();
}

function previousModule() {
    app.previousModule();
}

function toggleRecording() {
    app.toggleRecording();
}

function completeModule() {
    app.completeModule();
}

function showProgress() {
    app.showProgress();
}

function showTraining() {
    app.showTraining();
}

function showLogin() {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('register-form').style.display = 'none';
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-btn')[0].classList.add('active');
}

function showRegister() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-btn')[1].classList.add('active');
}

function logout() {
    app.logout();
}

function speakText(text) {
    app.speakText(text);
}

function startDialogGame() {
    app.startDialogGame();
}

function selectDialogOption(index) {
    app.selectDialogOption(index);
}

function nextDialogStep() {
    app.nextDialogStep();
}
