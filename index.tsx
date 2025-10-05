/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { GoogleGenAI, Chat } from "@google/genai";
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { TextPlugin } from 'gsap/TextPlugin';

document.addEventListener('DOMContentLoaded', () => {
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, TextPlugin);
    
    // --- Preloader ---
    const preloader = document.getElementById('preloader');
    if (preloader) {
        const preloaderLogo = document.querySelector('.preloader-logo');
        if (preloaderLogo) {
            gsap.fromTo(preloaderLogo, 
                { scale: 0.8, opacity: 0 }, 
                { scale: 1, opacity: 1, duration: 1, ease: 'power2.out', delay: 0.2 }
            );
        }
    
        window.addEventListener('load', () => {
            gsap.to(preloader, {
                opacity: 0,
                duration: 0.5,
                onComplete: () => preloader.classList.add('hidden')
            });
            
            // --- Page Load Animation ---
            const header = document.querySelector('header');
            if(header) {
                gsap.from(header, {
                    y: -50,
                    opacity: 0,
                    duration: 0.8,
                    ease: 'power3.out',
                    delay: 0.3
                });
            }
            
            gsap.to('.cursor, .cursor-outline', {
                opacity: 1,
                duration: 1,
                delay: 0.8,
                ease: 'power3.out'
            });

            // Specific hero title animation
            const heroTitle = document.querySelector('#hero .animated-title');
            if (heroTitle) {
                const chars = heroTitle.querySelectorAll('.char');
                gsap.from(chars, {
                    y: '100%',
                    opacity: 0,
                    stagger: 0.03,
                    duration: 1.2,
                    ease: 'power4.out',
                    delay: 0.4, 
                });
            }
        });
    }


    // --- Gemini AI Chat Assistant ---
    const chatButton = document.getElementById('ai-chat-button');
    const chatModal = document.getElementById('ai-chat-modal');
    const chatForm = document.getElementById('ai-chat-form') as HTMLFormElement | null;
    
    if (chatButton && chatModal && chatForm) {
        const chatClose = document.getElementById('ai-chat-close');
        const chatBackdrop = document.getElementById('ai-chat-backdrop');
        const chatInput = document.getElementById('ai-chat-input') as HTMLInputElement;
        const chatMessages = document.getElementById('ai-chat-messages');
        const chatSubmitButton = chatForm.querySelector('button[type="submit"]') as HTMLButtonElement;

        let chat: Chat;
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const systemInstruction = `You are JD, an AI assistant for John Doe, a creative developer. You are friendly, witty, and knowledgeable about his skills, projects, and experience. Your goal is to answer questions from potential recruiters or clients in a way that highlights John's strengths.

Keep your answers concise, engaging, and professional, but with a creative flair. Use the information below, but don't just copy-paste it. Rephrase it in a conversational way.

**About John Doe:**
- A creative developer with over 7 years of experience.
- Passionate about merging logic and creativity, building technically robust, performant, aesthetically pleasing, and intuitive digital experiences.
- Specializes in front-end interfaces and interactive 3D scenes.

**Core Skills:**
- **3D & Graphics:** Three.js, WebGL, GLSL, Blender
- **Frontend Frameworks:** React, TypeScript, Vue.js
- **Animation:** GSAP
- **Web Technologies:** Node.js, Web Audio API, WebXR, p5.js
- **Design Tools:** Figma

**Featured Projects:**
1.  **3D Product Configurator:**
    - **Challenge:** High-performance 3D configurator for complex models with real-time material customization.
    - **Solution:** Used a custom WebGL renderer, Draco compression, and smart texture loading for a smooth 60fps experience.
    - **Technologies:** Three.js, React, GSAP.
2.  **Generative Art Platform:**
    - **Challenge:** Allow users to create unique art with simple controls.
    - **Solution:** Developed modular algorithms (Perlin noise, etc.) and a real-time preview system. Increased user engagement by 300%.
    - **Technologies:** p5.js, Vue.js, Firebase.
3.  **VR Data Visualization:**
    - **Challenge:** Visualize complex datasets in VR for both desktop and mobile.
    - **Solution:** Created a hybrid interaction model (gaze + controller) and an adaptive spatial UI.
    - **Technologies:** A-Frame, WebXR, D3.js.
4.  **Interactive Music Experience:**
    - **Challenge:** Synchronize complex audio visualizations with music perfectly.
    - **Solution:** Built a custom audio analysis pipeline with the Web Audio API and a high-performance canvas renderer.
    - **Technologies:** Web Audio API, Canvas, GSAP.
5.  **Architectural Walkthrough:**
    - **Challenge:** Render detailed architectural models with realistic lighting in-browser.
    - **Solution:** Optimized models, baked lighting, and implemented a custom Level of Detail (LOD) system with PBR materials.
    - **Technologies:** Three.js, Blender, GLTF.

If you don't know the answer, politely say that it's beyond your knowledge but you can pass the message to John. Do not make up information.`;

            chat = ai.chats.create({
              model: 'gemini-2.5-flash',
              config: {
                  systemInstruction: systemInstruction,
              },
            });

            chatButton.addEventListener('click', openChat);
            chatClose?.addEventListener('click', closeChat);
            chatBackdrop?.addEventListener('click', closeChat);
            chatForm.addEventListener('submit', handleChatSubmit);

            addBotMessage("Hello! I'm JD, John's AI assistant. Feel free to ask me anything about his work or skills!");

        } catch (error) {
            console.error("Failed to initialize Gemini AI:", error);
            chatButton.style.display = 'none'; // Hide button if AI fails
        }
        
        function openChat() {
            chatModal.classList.remove('hidden');
            chatModal.classList.add('visible');
            document.body.style.overflow = 'hidden';
        }

        function closeChat() {
            chatModal.classList.remove('visible');
            setTimeout(() => {
                chatModal.classList.add('hidden');
                document.body.style.overflow = '';
            }, 300); // Match transition duration
        }

        function scrollChatToBottom() {
            if (!chatMessages) return;
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        function setFormState(isLoading: boolean) {
            if (!chatInput || !chatSubmitButton) return;
            chatInput.disabled = isLoading;
            chatSubmitButton.disabled = isLoading;
        }

        function addUserMessage(message: string) {
            if (!chatMessages) return;
            chatMessages.innerHTML += `
                <div class="chat-message user">
                    <div class="message-content">${message}</div>
                    <div class="avatar bg-indigo-600 text-white flex items-center justify-center font-bold">You</div>
                </div>`;
            scrollChatToBottom();
        }

        function addBotMessage(message: string, isStreaming = false) {
            if (!chatMessages) return null;
            const botMessageId = `bot-message-${Date.now()}`;
            chatMessages.innerHTML += `
                <div class="chat-message ai">
                    <div class="avatar bg-slate-700 flex items-center justify-center">
                        <svg class="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707.707"></path></svg>
                    </div>
                    <div class="message-content" id="${botMessageId}">${isStreaming ? '' : message}</div>
                </div>`;
            scrollChatToBottom();
            return document.getElementById(botMessageId);
        }
        
        function addTypingIndicator() {
            if (!chatMessages) return;
            chatMessages.innerHTML += `
                <div class="chat-message ai typing-indicator">
                     <div class="avatar bg-slate-700 flex items-center justify-center">
                         <svg class="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707.707"></path></svg>
                     </div>
                     <div class="message-content">
                        <span class="mr-1"></span><span></span><span class="ml-1"></span>
                     </div>
                </div>`;
            scrollChatToBottom();
        }

        function removeTypingIndicator() {
            const indicator = document.querySelector('.typing-indicator');
            if (indicator) {
                indicator.remove();
            }
        }

        async function handleChatSubmit(e: Event) {
            e.preventDefault();
            if (!chatInput) return;
            const message = chatInput.value.trim();
            if (!message) return;

            addUserMessage(message);
            chatInput.value = '';
            setFormState(true);
            addTypingIndicator();

            try {
                const stream = await chat.sendMessageStream({ message });
                removeTypingIndicator();
                const botMessageElement = addBotMessage('', true);
                let responseText = '';
                
                if (botMessageElement) {
                    for await (const chunk of stream) {
                        responseText += chunk.text;
                        botMessageElement.innerHTML = responseText.replace(/\n/g, '<br>'); // Basic markdown
                        scrollChatToBottom();
                    }
                }

            } catch (error) {
                console.error("Gemini API error:", error);
                removeTypingIndicator();
                addBotMessage("Sorry, I'm having trouble connecting right now. Please try again later.");
            } finally {
                setFormState(false);
                chatInput.focus();
            }
        }
    }


    // --- 3D Background Scene ---
    const canvas = document.querySelector('.webgl-canvas') as HTMLCanvasElement;
    if (canvas) {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 5;
        const renderer = new THREE.WebGLRenderer({ 
            canvas, 
            alpha: true, 
            antialias: true,
            powerPreference: "high-performance"
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const bloomParams = {
            exposure: 1,
            bloomStrength: 0.5,
            bloomThreshold: 0,
            bloomRadius: 0.5
        };
        
        const renderScene = new RenderPass(scene, camera);
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            bloomParams.bloomStrength,
            bloomParams.bloomRadius,
            bloomParams.bloomThreshold
        );
        
        const composer = new EffectComposer(renderer);
        composer.addPass(renderScene);
        composer.addPass(bloomPass);

        const objectsGroup = new THREE.Group();
        scene.add(objectsGroup);

        const geometries = [
            new THREE.IcosahedronGeometry(1, 1),
            new THREE.OctahedronGeometry(1, 1),
            new THREE.TorusKnotGeometry(0.8, 0.3, 100, 16),
            new THREE.DodecahedronGeometry(1, 0),
            new THREE.TorusGeometry(0.8, 0.3, 16, 32)
        ];

        const baseColor = new THREE.Color('#818cf8');
        const materials = [
            new THREE.MeshBasicMaterial({ color: baseColor, wireframe: true }),
            new THREE.MeshBasicMaterial({ color: baseColor, wireframe: true, transparent: true, opacity: 0.7 }),
            new THREE.PointsMaterial({ color: baseColor, size: 0.02 })
        ];

        let ySpreadFactor = document.body.scrollHeight / window.innerHeight;
        if (!isFinite(ySpreadFactor) || ySpreadFactor < 1) {
            ySpreadFactor = 3; 
        }

        for (let i = 0; i < 80; i++) {
            const geometry = geometries[Math.floor(Math.random() * geometries.length)];
            const material = materials[Math.floor(Math.random() * materials.length)].clone();
            
            let object;
            if (material instanceof THREE.PointsMaterial) {
                object = new THREE.Points(geometry, material);
            } else {
                object = new THREE.Mesh(geometry, material);
            }
            
            object.position.x = (Math.random() - 0.5) * 20;
            object.position.y = -(Math.random() * (ySpreadFactor * 8));
            object.position.z = (Math.random() - 0.5) * 20;
            object.rotation.x = Math.random() * Math.PI;
            object.rotation.y = Math.random() * Math.PI;
            
            object.userData = {
                speed: Math.random() * 0.002 + 0.001,
                rotationSpeed: Math.random() * 0.01 + 0.005,
                amplitude: Math.random() * 0.5 + 0.1,
                frequency: Math.random() * 0.01 + 0.005
            };
            
            objectsGroup.add(object);
        }

        const particleCount = 500;
        const particles = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        const particleSizes = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            particlePositions[i * 3] = (Math.random() - 0.5) * 50;
            particlePositions[i * 3 + 1] = -(Math.random() * (ySpreadFactor * 10));
            particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 50;
            particleSizes[i] = Math.random() * 0.1 + 0.05;
        }

        particles.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        particles.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: baseColor,
            size: 0.1,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.8
        });
        
        const particleSystem = new THREE.Points(particles, particleMaterial);
        scene.add(particleSystem);
        
        // --- Dynamic Scene Color Change on Scroll ---
        const colorThemes = {
            default: new THREE.Color('#818cf8'),
            about: new THREE.Color('#a78bfa'),
            skills: new THREE.Color('#7dd3fc'),
            projects: new THREE.Color('#f472b6'),
            contact: new THREE.Color('#f59e0b'),
        };

        const allMaterials = [particleMaterial, ...objectsGroup.children.map(c => (c as THREE.Mesh).material as THREE.Material)];

        const changeSceneColor = (color: THREE.Color) => {
            allMaterials.forEach(material => {
                // All materials in the scene (MeshBasicMaterial, PointsMaterial) have a `color` property.
                // We cast the material to access this property since the base THREE.Material type doesn't include it.
                if (material) {
                     gsap.to((material as THREE.MeshBasicMaterial).color, {
                        r: color.r,
                        g: color.g,
                        b: color.b,
                        duration: 1.5,
                        ease: 'sine.inOut'
                    });
                }
            });
        };

        ScrollTrigger.create({ trigger: '#hero', start: 'top center', end: 'bottom center', onToggle: self => self.isActive && changeSceneColor(colorThemes.default) });
        ScrollTrigger.create({ trigger: '#about', start: 'top center', end: 'bottom center', onToggle: self => self.isActive && changeSceneColor(colorThemes.about) });
        ScrollTrigger.create({ trigger: '#skills', start: 'top center', end: 'bottom center', onToggle: self => self.isActive && changeSceneColor(colorThemes.skills) });
        ScrollTrigger.create({ trigger: '#projects', start: 'top center', end: 'bottom center', onToggle: self => self.isActive && changeSceneColor(colorThemes.projects) });
        ScrollTrigger.create({ trigger: '#contact', start: 'top center', end: 'bottom center', onToggle: self => self.isActive && changeSceneColor(colorThemes.contact) });

        const clock = new THREE.Clock();
        const animate = () => {
            const elapsedTime = clock.getElapsedTime();
            
            objectsGroup.children.forEach(obj => {
                obj.rotation.x += obj.userData.rotationSpeed;
                obj.rotation.y += obj.userData.rotationSpeed * 0.7;
                obj.position.y += Math.sin(elapsedTime * obj.userData.frequency) * obj.userData.amplitude * 0.01;
            });
            
            particleSystem.rotation.y += 0.0005;
            
            composer.render();
            window.requestAnimationFrame(animate);
        };
        animate();

        window.addEventListener('scroll', () => {
            camera.position.y = -window.scrollY / window.innerHeight * 3;
        });
        
        const cursor = { x: 0, y: 0 };
        window.addEventListener('mousemove', (event: MouseEvent) => {
            cursor.x = event.clientX / window.innerWidth - 0.5;
            cursor.y = event.clientY / window.innerHeight - 0.5;
            gsap.to(objectsGroup.rotation, {
                y: -cursor.x * 0.5,
                x: cursor.y * 0.5,
                duration: 1,
                ease: 'power2.out'
            });
        });

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            composer.setSize(window.innerWidth, window.innerHeight);
             let newYSpreadFactor = document.body.scrollHeight / window.innerHeight;
            if (isFinite(newYSpreadFactor) && newYSpreadFactor >= 1) {
                ySpreadFactor = newYSpreadFactor;
            }
        });
    }

    // --- Custom Cursor & Light Flare---
    const cursorDot = document.querySelector('.cursor') as HTMLElement | null;
    const cursorOutline = document.querySelector('.cursor-outline') as HTMLElement | null;
    const lightFlare = document.querySelector('.cursor-light-flare') as HTMLElement | null;

    if (cursorDot && cursorOutline) {
        window.addEventListener('mousemove', (e: MouseEvent) => {
            const { clientX, clientY } = e;
            gsap.to(cursorDot, { x: clientX, y: clientY, duration: 0.2, ease: 'power2.out' });
            gsap.to(cursorOutline, { x: clientX, y: clientY, duration: 0.4, ease: 'power2.out' });
            if (lightFlare) {
                gsap.to(lightFlare, { x: clientX, y: clientY, duration: 0.6, ease: 'power2.out' });
            }
        });
        
        document.querySelectorAll('a, button, .project-card').forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursorOutline.classList.add('cursor-active');
                cursorDot.classList.add('cursor-click');
            });
            el.addEventListener('mouseleave', () => {
                cursorOutline.classList.remove('cursor-active');
                cursorDot.classList.remove('cursor-click');
            });
        });
    }
    
    document.querySelectorAll('.magnetic-link').forEach((button: Element) => {
        const htmlButton = button as HTMLElement;
        htmlButton.addEventListener('mousemove', (e: MouseEvent) => {
            const rect = htmlButton.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const distanceX = x - centerX;
            const distanceY = y - centerY;
            gsap.to(htmlButton, {
                x: distanceX * 0.2,
                y: distanceY * 0.2,
                duration: 0.3
            });
        });
        
        htmlButton.addEventListener('mouseleave', () => {
            gsap.to(htmlButton, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
        });
    });

    // --- Advanced Text Animations ---
    function splitTextIntoSpans(selector: string) {
        document.querySelectorAll(selector).forEach((element: Element) => {
            const htmlElement = element as HTMLElement;
            const text = htmlElement.textContent;
            if (!text) return;
            htmlElement.innerHTML = '';
            const words = text.split(' ');
            words.forEach((word, i) => {
                const wordSpan = document.createElement('span');
                wordSpan.className = 'line-wrap';
                const chars = word.split('');
                chars.forEach(char => {
                    const charSpan = document.createElement('span');
                    charSpan.className = 'char';
                    charSpan.textContent = char;
                    wordSpan.appendChild(charSpan);
                });
                if (i < words.length - 1) {
                    const spaceSpan = document.createElement('span');
                    spaceSpan.className = 'char';
                    spaceSpan.textContent = '\u00A0';
                    wordSpan.appendChild(spaceSpan);
                }
                htmlElement.appendChild(wordSpan);
            });
        });
    }
    
    splitTextIntoSpans('.animated-title');
    
    // Animate non-hero titles on scroll
    gsap.utils.toArray('section:not(#hero) .animated-title').forEach((title: any) => {
        const chars = title.querySelectorAll('.char');
        gsap.from(chars, {
            y: '100%',
            opacity: 0,
            stagger: 0.03,
            duration: 0.8,
            ease: 'back.out(1.7)',
            scrollTrigger: {
                trigger: title,
                start: 'top 85%',
                toggleActions: 'play none none none'
            }
        });
    });
    
    gsap.utils.toArray('.animated-subtitle').forEach((subtitle: any) => {
        gsap.from(subtitle, {
            opacity: 0,
            y: 20,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: subtitle,
                start: 'top 85%',
                toggleActions: 'play none none none'
            }
        });
    });

    // --- Horizontal Scroll for Projects ---
    const projectsWrapper = document.getElementById('projects-wrapper');
    const projectsContainer = document.getElementById('projects-container');
    if (projectsWrapper && projectsContainer) {
        gsap.to(projectsWrapper, {
            x: () => -(projectsWrapper.scrollWidth - projectsContainer.clientWidth) + "px",
            ease: "none",
            scrollTrigger: {
                trigger: projectsContainer,
                start: "top top",
                end: () => "+=" + (projectsWrapper.scrollWidth - projectsContainer.clientWidth),
                scrub: true,
                pin: true,
                invalidateOnRefresh: true,
            }
        });

        // --- Project Card Tilt Effect ---
        const projectCards = document.querySelectorAll('#projects-wrapper .project-card');
        projectCards.forEach((card: Element) => {
            const htmlCard = card as HTMLElement;
            htmlCard.addEventListener('mousemove', (e: MouseEvent) => {
                const rect = htmlCard.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const rotateY = gsap.utils.mapRange(0, rect.width, -15, 15, x);
                const rotateX = gsap.utils.mapRange(0, rect.height, 15, -15, y);
                
                gsap.to(htmlCard, {
                    rotationY: rotateY * 0.5,
                    rotationX: rotateX * 0.5,
                    transformPerspective: 1000,
                    duration: 0.5,
                    ease: 'power2.out'
                });
            });
            
            htmlCard.addEventListener('mouseleave', () => {
                gsap.to(htmlCard, {
                    rotationY: 0,
                    rotationX: 0,
                    duration: 0.8,
                    ease: 'elastic.out(1, 0.5)'
                });
            });
        });
    }
    
    // --- Scroll Indicator ---
    const sections = document.querySelectorAll('section');
    const scrollDots = document.querySelectorAll('.scroll-dot');
    if (sections.length > 0 && scrollDots.length > 0) {
        sections.forEach((section, index) => {
            ScrollTrigger.create({
                trigger: section,
                start: 'top center',
                end: 'bottom center',
                onToggle: self => {
                    if(self.isActive) {
                        scrollDots.forEach(dot => dot.classList.remove('active'));
                        if (scrollDots[index]) {
                            scrollDots[index].classList.add('active');
                        }
                    }
                }
            });
        });
        
        scrollDots.forEach((dot: Element) => {
            const htmlDot = dot as HTMLElement;
            htmlDot.addEventListener('click', () => {
                if (htmlDot.dataset.section) {
                    const section = document.getElementById(htmlDot.dataset.section);
                    if (section) {
                        gsap.to(window, {
                            scrollTo: section,
                            duration: 1,
                            ease: 'power3.out'
                        });
                    }
                }
            });
        });
    }

    // --- Dynamic Content Injection ---
    // Skills
    const skillsContainer = document.querySelector('#skills .grid');
    if (skillsContainer) {
        const skills = [
            { name: 'Three.js', icon: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M1.333 8l10.667-4l10.667 4v8l-10.667 4l-10.667-4V8zm1.334 0v6.667l9.333 3.333l9.333-3.333V8l-9.333-3.333L2.667 8z"/></svg>` },
            { name: 'React', icon: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8zm-4.5-8.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5zm4.5 0c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5zm4.5 0c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5z"/></svg>` },
            { name: 'GSAP', icon: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8a8 8 0 0 1-8 8zm-1-12h2v6h-2zm0 8h2v2h-2z"/></svg>` },
            { name: 'WebGL', icon: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 0 0-10 10a10 10 0 0 0 10 10a10 10 0 0 0 10-10A10 10 0 0 0 12 2m0 2a8 8 0 0 1 8 8a8 8 0 0 1-8 8a8 8 0 0 1-8-8a8 8 0 0 1 8-8m-1 2v8h1.5V8H13v4h-1V6h-2z"/></svg>` },
            { name: 'Figma', icon: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm0 4c1.1 0 2 .9 2 2s-.9 2-2 2s-2-.9-2-2s.9-2 2-2zm0 12c-2.21 0-4-1.79-4-4h8c0 2.21-1.79 4-4 4z"/></svg>` },
            { name: 'Blender', icon: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M8.27 4.05c-.5.05-1 .08-1.5.08-.17 0-.33 0-.5-.03C5.5 8 4 11.8 4 15.73c0 .92.12 1.83.35 2.7.1-.4.23-.8.38-1.17.7-1.7 1.9-3.2 3.38-4.3-1.62-1.1-2.8-2.7-3.38-4.55M12 7c.97 0 1.9.17 2.78.45a7.9 7.9 0 0 1 2.1 1.08c.08.05.15.1.22.17.62.5 1.13 1.1 1.5 1.8.38.7.6 1.45.75 2.23.15.78.2 1.58.15 2.38-.05.8-.2 1.6-.45 2.35-.25.75-.6 1.45-1.05 2.1-.45.65-1 1.22-1.6 1.7-.63.48-1.3.85-2.05 1.1-.75.26-1.55.4-2.35.42-.8.03-1.6-.05-2.35-.25a7.1 7.1 0 0 1-2.1-.8c-.65-.35-1.23-.8-1.73-1.33-.5-.53-.9-1.15-1.2-1.83-.3-.68-.5-1.4-.58-2.15-.08-.75-.05-1.5.08-2.23.13-.73.38-1.42.73-2.05.35-.63.8-1.2 1.33-1.68.53-.48 1.15-.85 1.83-1.1C9.4 7.2 10.2 7.03 11 7h1m-1 2c-.6 0-1.18.1-1.73.3a5.4 5.4 0 0 0-1.5.83c-.42.38-.77.82-1.05 1.32-.28.5-.48 1.05-.6 1.63-.12.58-.15 1.18-.08 1.77.07.6.23 1.17.48 1.7.25.53.58 1 1 1.4.42.4.92.72 1.45.95.53.23 1.1.37 1.68.42.58.05 1.17 0 1.73-.15.55-.15 1.08-.38 1.55-.7.47-.32.88-.72 1.2-1.18.32-.46.57-.97.72-1.52.15-.55.22-1.13.2-1.7-.03-.58-.15-1.15-.35-1.68-.2-.53-.5-1.02-.87-1.45-.38-.43-.83-.8-1.33-1.1A5.4 5.4 0 0 0 12 9h-1z"/></svg>` },
            { name: 'Node.js', icon: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>` },
            { name: 'TypeScript', icon: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 3h18v18H3V3m10.71 14.86c.5.98 1.51 1.73 3.09 1.73c1.6 0 2.8-.83 2.8-2.36c0-1.41-.81-2.04-2.25-2.66l-.42-.18c-.73-.31-1.04-.52-1.04-1.02c0-.41.31-.73.81-.73c.48 0 .8.21 1.09.73l1.31-.87c-.55-.96-1.33-1.33-2.4-1.33c-1.51 0-2.48.96-2.48 2.23c0 1.38.81 2.03 2.03 2.55l.42.18c.78.34 1.24.55 1.24 1.13c0 .48-.45.83-1.15.83c-.83 0-1.31-.43-1.67-1.03l-1.38.8M13 11.25H8v1.5h1.5V20h1.75v-7.25H13v-1.5z"/></svg>` }
        ];
        
        skillsContainer.innerHTML = skills.map((skill) => `
            <div class="skill-card p-8 rounded-xl text-center transition-all duration-300">
                <div class="relative">
                    <div class="h-16 w-16 mx-auto mb-4 text-indigo-400">${skill.icon}</div>
                    <h3 class="font-semibold text-white text-lg">${skill.name}</h3>
                </div>
            </div>
        `).join('');

        gsap.utils.toArray('.skill-card').forEach((card: any, i) => {
            gsap.from(card, {
                opacity: 0,
                y: 50,
                duration: 0.5,
                delay: i * 0.1,
                ease: 'back.out(1.7)',
                scrollTrigger: {
                    trigger: card,
                    start: 'top 90%',
                    toggleActions: 'play none none none'
                }
            });
        });
    }
    
    // Projects
    const projects = [
        { 
            id: 1, 
            title: '3D Product Configurator', 
            img: 'https://placehold.co/600x400/111827/a78bfa?text=3D+Product+Configurator', 
            tags: ["Three.js", "React", "GSAP"], 
            challenge: "Creating a high-performance 3D product configurator that could handle complex models with customizable materials in real-time without compromising on visual quality or user experience.", 
            solution: "Implemented a custom WebGL renderer with optimized shaders, using Draco compression for model geometry and a smart texture loading system. Developed a state management solution to only update changed components, reducing unnecessary re-renders by 70%. The result was a buttery-smooth 60fps experience even with complex models.",
            link: "#"
        },
        { 
            id: 2, 
            title: 'Generative Art Platform', 
            img: 'https://placehold.co/600x400/111827/7dd3fc?text=Generative+Art+Platform', 
            tags: ["p5.js", "Vue.js", "Firebase"], 
            challenge: "Building an interactive platform where users could create unique generative art pieces with simple controls, requiring the system to produce aesthetically diverse results from limited inputs.", 
            solution: "Designed a modular algorithm architecture combining Perlin noise, trigonometric functions, and color theory principles. Implemented a preview system that showed real-time results without performance lag. Added social sharing and gallery features that increased user engagement by 300%.",
            link: "#"
        },
        { 
            id: 3, 
            title: 'VR Data Visualization', 
            img: 'https://placehold.co/600x400/111827/f472b6?text=VR+Data+Viz', 
            tags: ["A-Frame", "WebXR", "D3.js"], 
            challenge: "Visualizing complex datasets in VR space while maintaining intuitive navigation and interaction patterns that worked across both desktop and mobile VR devices.", 
            solution: "Created a hybrid interaction model combining gaze-based selection with controller input. Developed a spatial UI system that adapted to user position and scale. Implemented progressive enhancement to ensure the experience worked across all devices, with the full VR version offering additional immersion.",
            link: "#"
        },
        { 
            id: 4, 
            title: 'Interactive Music Experience', 
            img: 'https://placehold.co/600x400/111827/86efac?text=Music+Experience', 
            tags: ["Web Audio API", "Canvas", "GSAP"], 
            challenge: "Synchronizing complex audio visualizations with music playback while maintaining perfect timing across different devices and network conditions.", 
            solution: "Built a custom audio analysis pipeline using the Web Audio API, with fallback mechanisms for timing discrepancies. Created a canvas-based rendering system that could handle thousands of particles at 60fps. The result was an immersive experience that worked flawlessly across all modern browsers.",
            link: "#"
        },
        { 
            id: 5, 
            title: 'Architectural Walkthrough', 
            img: 'https://placehold.co/600x400/111827/f59e0b?text=Arch+Viz', 
            tags: ["Three.js", "Blender", "GLTF"], 
            challenge: "Rendering highly detailed architectural models in the browser with realistic lighting and materials, while maintaining interactive framerates.", 
            solution: "Optimized models using Blender's decimation tools and baked lighting. Implemented a custom LOD (Level of Detail) system that dynamically adjusted model complexity based on camera distance. Used environment maps and PBR materials to achieve photorealistic quality without sacrificing performance.",
            link: "#"
        }
    ];
    
    if (projectsWrapper) {
        projectsWrapper.innerHTML = projects.map(p => `
            <div class="project-card rounded-xl overflow-hidden group" data-project-id="${p.id}">
                <div class="project-image-container relative">
                    <img src="${p.img}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="${p.title}">
                    <div class="project-image-overlay"></div>
                    <div class="absolute bottom-0 left-0 right-0 p-6 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <div class="flex flex-wrap gap-2">
                            ${p.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </div>
                    </div>
                </div>
                <div class="p-6 flex-grow flex flex-col">
                    <h3 class="text-xl font-bold text-white mb-2">${p.title}</h3>
                    <button class="mt-auto font-semibold text-indigo-400 hover:text-indigo-300 transition magnetic-link project-details-button flex items-center gap-2 w-fit">
                        <span>View Details</span>
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    // Project Modal
    const modal = document.getElementById('project-modal');
    const modalClose = document.getElementById('modal-close');
    
    if (modal && modalClose) {
        const closeModal = () => {
            const modalTransform = modal.querySelector('.transform');
            if (!modalTransform) return;
            gsap.to(modalTransform, {
                opacity: 0, scale: 0.95, y: 20, duration: 0.3, ease: 'power2.in',
                onComplete: () => {
                    modal.classList.add('hidden');
                    document.body.style.overflow = 'auto';
                }
            });
        };

        document.querySelectorAll('.project-details-button').forEach(button => {
            button.addEventListener('click', () => {
                const projectCard = button.closest('.project-card') as HTMLElement | null;
                if (projectCard && projectCard.dataset.projectId) {
                    const projectId = parseInt(projectCard.dataset.projectId);
                    const project = projects.find(p => p.id === projectId);
                    
                    if (project) {
                        (document.getElementById('modal-image') as HTMLImageElement).src = project.img;
                        (document.getElementById('modal-image') as HTMLImageElement).alt = project.title;
                        
                        const modalTitle = document.getElementById('modal-title');
                        if (modalTitle) modalTitle.textContent = project.title;

                        const modalTags = document.getElementById('modal-tags');
                        if (modalTags) modalTags.innerHTML = project.tags.map(tag => `<span class="tag">${tag}</span>`).join('');

                        const modalChallenge = document.getElementById('modal-challenge');
                        if (modalChallenge) modalChallenge.textContent = project.challenge;
                        
                        const modalSolution = document.getElementById('modal-solution');
                        if (modalSolution) modalSolution.textContent = project.solution;

                        const modalLink = document.getElementById('modal-link') as HTMLAnchorElement | null;
                        if(modalLink) modalLink.href = project.link;
                        
                        modal.classList.remove('hidden');
                        document.body.style.overflow = 'hidden';

                        const modalTransform = modal.querySelector('.transform');
                        if(modalTransform) {
                            gsap.fromTo(modalTransform, 
                                { opacity: 0, scale: 0.95, y: 20 },
                                { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: 'power2.out' }
                            );
                        }
                    }
                }
            });
        });
        
        modalClose.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
    
    // Contact Form Interactivity
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const submitButton = document.getElementById('contact-submit-button') as HTMLButtonElement;
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.querySelector('span')!.textContent = 'Sending...';
                
                // Simulate network request
                setTimeout(() => {
                    submitButton.disabled = false;
                    submitButton.querySelector('span')!.textContent = 'Send Message';
                    // Here you would add success/error handling
                }, 2000);
            }
        });
    }

    // --- Mobile Menu ---
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
            if (!mobileMenu.classList.contains('hidden')) {
                mobileMenu.innerHTML = `
                    <a href="#about" class="block py-2 text-slate-300 hover:text-white transition">About</a>
                    <a href="#skills" class="block py-2 text-slate-300 hover:text-white transition">Skills</a>
                    <a href="#projects" class="block py-2 text-slate-300 hover:text-white transition">Projects</a>
                    <a href="#contact" class="block py-2 px-4 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition w-fit">Contact</a>
                `;
            }
        });
    }

    // --- Smooth Scrolling ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (!targetId) return;

            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                gsap.to(window, {
                    scrollTo: {
                        y: targetElement,
                        offsetY: 80
                    },
                    duration: 1,
                    ease: 'power3.out'
                });
                
                if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
                    mobileMenu.classList.add('hidden');
                }
            }
        });
    });
});