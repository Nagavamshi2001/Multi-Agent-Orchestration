<template>
  <div v-if="modelValue" class="login-modal-backdrop">
    <div class="login-modal">
      <div class="login-logo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="login-logo-svg">
          <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
          <path d="M2 17l10 5 10-5"></path>
          <path d="M2 12l10 5 10-5"></path>
        </svg>
      </div>
      <h2 class="login-modal-title">{{ isRegistering ? 'Create Account' : 'Welcome to Agent Hub' }}</h2>
      <p class="login-modal-text">
        Please sign in to access your personal AI assistants.
      </p>

      <form @submit.prevent="handleSubmit" class="login-form">
        <div v-if="error" class="error-message">{{ error }}</div>
        
        <div v-if="isRegistering" class="form-group">
          <label for="name">Name</label>
          <input 
            id="name"
            v-model="name"
            type="text"
            placeholder="Your name"
            required
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input 
            id="email"
            v-model="email"
            type="email"
            placeholder="you@example.com"
            required
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input 
            id="password"
            v-model="password"
            type="password"
            placeholder="********"
            required
            class="form-input"
          />
        </div>

        <button type="submit" class="login-modal-primary full-width" :disabled="loading">
          {{ loading ? 'Processing...' : (isRegistering ? 'Sign Up' : 'Sign In') }}
        </button>
      </form>

      <div class="divider">
        <span>or</span>
      </div>

      <div class="login-modal-actions vertical">
        <button class="login-modal-google full-width" @click="$emit('login')">
          <svg class="google-icon" viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
            <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
              <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
              <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.059 -13.144 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
              <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.489 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.989 -25.464 56.619 L -21.484 53.529 Z"/>
              <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
            </g>
          </svg>
          Continue with Google
        </button>
        
        <button class="login-modal-secondary full-width" @click="$emit('update:modelValue', false)" v-if="false">
          Maybe later
        </button>
      </div>

      <div class="toggle-mode">
        {{ isRegistering ? 'Already have an account?' : "Don't have an account?" }}
        <a href="#" @click.prevent="toggleMode">{{ isRegistering ? 'Sign In' : 'Sign Up' }}</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { login, register } from '../services/auth.js';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue', 'login', 'auth-success']);

const isRegistering = ref(false);
const email = ref('');
const password = ref('');
const name = ref('');
const loading = ref(false);
const error = ref('');

const toggleMode = () => {
  isRegistering.value = !isRegistering.value;
  error.value = '';
  email.value = '';
  password.value = '';
  name.value = '';
};

const handleSubmit = async () => {
  error.value = '';
  loading.value = true;
  
  try {
    let result;
    if (isRegistering.value) {
      result = await register(email.value, password.value, name.value);
    } else {
      result = await login(email.value, password.value);
    }
    
    if (result.success) {
      emit('auth-success', result.user);
      emit('update:modelValue', false);
      // Clean up URL if we had login query param
      const url = new URL(window.location.href);
      if (url.searchParams.has('login')) {
        url.searchParams.delete('login');
        const newUrl = url.pathname + (url.search ? url.search : '');
        window.history.replaceState({}, '', newUrl);
      }
      window.location.reload();
    }
  } catch (err) {
    error.value = err.response?.data?.error || 'Authentication failed. Please try again.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.login-modal {
  width: 100%;
  max-width: 380px;
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: 32px 32px;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05) inset;
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.login-logo {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  box-shadow: 0 0 20px var(--color-primary-glow);
}

.login-logo-svg {
  width: 28px;
  height: 28px;
  color: var(--color-primary);
}

.login-modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--color-text);
  text-align: center;
}

.login-modal-text {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin-bottom: 20px;
  text-align: center;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 16px;
  width: 100%;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text);
}

.form-input {
  padding: 10px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: var(--color-primary);
}

.error-message {
  color: #ef4444;
  font-size: 0.85rem;
  padding: 8px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: var(--radius-md);
  text-align: center;
}

.login-modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.login-modal-actions.vertical {
  flex-direction: column;
}

.full-width {
  width: 100%;
}

.toggle-mode {
  margin-top: 16px;
  text-align: center;
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.login-modal-primary {
  padding: 10px 14px;
  border-radius: var(--radius-md);
  border: none;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: #fff;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px var(--color-primary-glow);
  transition: var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;
}
.login-modal-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px var(--color-primary-glow);
}
.login-modal-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.login-modal-google {
  padding: 10px 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.login-modal-google:hover {
  background: var(--color-bg);
  border-color: var(--color-border-hover);
}

.login-modal-secondary {
  padding: 10px 12px;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
}
.login-modal-secondary:hover {
  color: var(--color-text);
  background: rgba(148, 163, 184, 0.08);
}

.divider {
  display: flex;
  align-items: center;
  margin: 16px 0;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  width: 100%;
}
.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid var(--color-border);
}
.divider span {
  padding: 0 10px;
}

.login-modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  flex-wrap: wrap;
  width: 100%;
}
.toggle-mode a {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 600;
  margin-left: 5px;
}
.toggle-mode a:hover {
  text-decoration: underline;
}
</style>
