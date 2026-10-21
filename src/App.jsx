import Header from './components/Header.jsx'
import Hero from './components/Hero.jsx'
import MainContent from './components/MainContent.jsx'
import Footer from './components/Footer.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { MenuProvider } from './context/MenuContext.jsx'

function App() {
  return (
    <AuthProvider>
      <MenuProvider>
        <a
          className="absolute left-3 top-[-100px] z-10 bg-white px-5 py-3 text-ink focus:top-3"
          href="#main"
        >
          Skip to content
        </a>
        <Header />
        <main id="main">
          <Hero />
          <MainContent />
        </main>
        <Footer />
      </MenuProvider>
    </AuthProvider>
  )
}

export default App
