import { ArrowRight, Zap, Shield, Globe } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import './home-page.css';

const HomePage: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    {/* Header */}
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-600 rounded-lg" />
            <h1 className="text-2xl font-bold text-gray-800">Hoolsy</h1>
          </div>
          <nav className="flex items-center gap-6">
            <Link to="/demopage" className="text-gray-600 hover:text-gray-800 transition-colors">
              Dashboard
            </Link>
            <button className="bg-gray-600 text-white px-4 py-2 rounded-xl hover:bg-gray-700 transition-colors">
              Get Started
            </button>
          </nav>
        </div>
      </div>
    </header>

    {/* Hero Section */}
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-5xl font-bold text-gray-900 mb-6">
          Build Better
          <span className="text-gray-600"> Projects</span>
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Streamline your workflow with powerful project management tools designed for modern teams.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            to="/demopage"
            className="bg-gray-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            View Dashboard
            <ArrowRight className="w-5 h-5" />
          </Link>
          <button className="bg-white text-gray-600 px-8 py-4 rounded-xl font-semibold border border-gray-300 hover:bg-gray-50 transition-colors">
            Learn More
          </button>
        </div>
      </div>
    </section>

    {/* Features */}
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">Everything you need</h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Powerful features to help you manage projects, track progress, and collaborate with your
            team.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-gray-600" />
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">Lightning Fast</h4>
            <p className="text-gray-600">
              Built with modern technologies for optimal performance and user experience.
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-gray-600" />
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">Secure & Reliable</h4>
            <p className="text-gray-600">
              Enterprise-grade security with 99.9% uptime guarantee for your peace of mind.
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Globe className="w-6 h-6 text-gray-600" />
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">Global Access</h4>
            <p className="text-gray-600">
              Access your projects from anywhere in the world with our cloud-based platform.
            </p>
          </div>
        </div>
      </div>
    </section>

    {/* CTA Section */}
    <section className="py-16 bg-gray-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h3 className="text-3xl font-bold text-white mb-4">Ready to get started?</h3>
        <p className="text-gray-200 mb-8 max-w-2xl mx-auto">
          Join thousands of teams already using Hoolsy to manage their projects more effectively.
        </p>
        <Link
          to="/demopage"
          className="bg-white text-gray-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
        >
          Try Dashboard
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </section>

    {/* Footer */}
    <footer className="bg-white border-t border-gray-200 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-gray-600">© 2024 Hoolsy. All rights reserved.</p>
      </div>
    </footer>
  </div>
);

export default HomePage;
