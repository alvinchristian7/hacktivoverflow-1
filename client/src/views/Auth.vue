<template>
  <div>
    <div style="display: flex; justify-content: center;">
      <v-btn @click="registerForm = !registerForm">{{toggle}}</v-btn>
    </div>
    <LogRegForm @submitted="register" v-show="registerForm" teks="Register">
      <v-text-field v-model="name" :rules="nameRules" prepend-icon="person" name="name" label="Name" type="text"></v-text-field>
    </LogRegForm>

    <LogRegForm v-show="!registerForm" teks="Login" @submitted="login">
      <template v-slot:google>
      <div id="google-signin-button"></div>
      </template>
    </LogRegForm>
  </div>
</template>
<script>
import LogRegForm from '@/components/LogRegForm'

export default {
  components: {
    LogRegForm,
  },
  data(){
    return{
      name: '',
      toggle: 'Login',
      registerForm: true,
      nameRules: [
        v => !!v || 'Name is required',
        v => v.length >= 3 || 'Name must be more than equal 3 characters'
      ],
    }
  },
  watch: {
    registerForm(newBool, oldBool){
      if(newBool) this.toggle = 'Login'
      else this.toggle = 'Register'
    }
  },
  mounted() {
    gapi.signin2.render("google-signin-button", {
      onsuccess: this.onSignIn
    });
  },
  methods: {
    register(email,password){
      this.$store.dispatch('register',{ 
        name: this.name, email, password })
      this.name = ''
    },
    login(email,password){
      this.$store.dispatch('login',{ 
        email, password })
    },
    onSignIn(googleUser) {
      console.log("Google nih");

      let id_token = googleUser.getAuthResponse().id_token;
      this.$store.dispatch('googleSignIn',id_token)
      .then(data =>{

      })
      .catch(err =>{
        console.log(err)
      })
    }
  }
}
</script>
