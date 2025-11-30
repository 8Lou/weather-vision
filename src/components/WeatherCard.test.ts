import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import WeatherCard from './WeatherCard.vue';
import type { City, WeatherData } from '../types/models';

describe('WeatherCard', () => {
  const mockCity: City = {
    id: '1',
    name: 'London',
    country: 'UK',
    coordinates: { lat: 51.5074, lon: -0.1278 },
    addedAt: Date.now()
  };

  const mockWeather: WeatherData = {
    cityId: '1',
    temperature: 15.5,
    feelsLike: 13.2,
    description: 'broken clouds',
    icon: '04d',
    wind: {
      speed: 5.5,
      direction: 'SSE',
      degrees: 150
    },
    pressure: 1013,
    humidity: 72,
    dewPoint: 10.5,
    visibility: 10,
    fetchedAt: Date.now()
  };

  it('renders loading state when isLoading is true', () => {
    const wrapper = mount(WeatherCard, {
      props: {
        city: mockCity,
        weather: mockWeather,
        isLoading: true
      }
    });

    expect(wrapper.find('.weather-card__loading').exists()).toBe(true);
    expect(wrapper.text()).toContain('Loading weather data...');
  });

  it('renders weather data when not loading', () => {
    const wrapper = mount(WeatherCard, {
      props: {
        city: mockCity,
        weather: mockWeather,
        isLoading: false
      }
    });

    expect(wrapper.find('.weather-card__content').exists()).toBe(true);
    expect(wrapper.find('.weather-card__loading').exists()).toBe(false);
  });

  it('displays city name and country code', () => {
    const wrapper = mount(WeatherCard, {
      props: {
        city: mockCity,
        weather: mockWeather,
        isLoading: false
      }
    });

    expect(wrapper.text()).toContain('London, UK');
  });

  it('displays temperature', () => {
    const wrapper = mount(WeatherCard, {
      props: {
        city: mockCity,
        weather: mockWeather,
        isLoading: false
      }
    });

    expect(wrapper.text()).toContain('16°C'); // Rounded from 15.5
  });

  it('displays feels-like temperature', () => {
    const wrapper = mount(WeatherCard, {
      props: {
        city: mockCity,
        weather: mockWeather,
        isLoading: false
      }
    });

    expect(wrapper.text()).toContain('Feels like 13°C');
  });

  it('displays weather description', () => {
    const wrapper = mount(WeatherCard, {
      props: {
        city: mockCity,
        weather: mockWeather,
        isLoading: false
      }
    });

    expect(wrapper.text()).toContain('broken clouds');
  });

  it('displays weather icon with correct URL', () => {
    const wrapper = mount(WeatherCard, {
      props: {
        city: mockCity,
        weather: mockWeather,
        isLoading: false
      }
    });

    const icon = wrapper.find('.weather-card__icon');
    expect(icon.exists()).toBe(true);
    expect(icon.attributes('src')).toBe('https://openweathermap.org/img/wn/04d@2x.png');
    expect(icon.attributes('alt')).toBe('broken clouds');
  });

  it('displays wind speed and direction', () => {
    const wrapper = mount(WeatherCard, {
      props: {
        city: mockCity,
        weather: mockWeather,
        isLoading: false
      }
    });

    expect(wrapper.text()).toContain('5.5 m/s SSE');
  });

  it('displays atmospheric pressure', () => {
    const wrapper = mount(WeatherCard, {
      props: {
        city: mockCity,
        weather: mockWeather,
        isLoading: false
      }
    });

    expect(wrapper.text()).toContain('1013 hPa');
  });

  it('displays humidity', () => {
    const wrapper = mount(WeatherCard, {
      props: {
        city: mockCity,
        weather: mockWeather,
        isLoading: false
      }
    });

    expect(wrapper.text()).toContain('72%');
  });

  it('displays dew point', () => {
    const wrapper = mount(WeatherCard, {
      props: {
        city: mockCity,
        weather: mockWeather,
        isLoading: false
      }
    });

    expect(wrapper.text()).toContain('11°C'); // Rounded from 10.5
  });

  it('displays visibility', () => {
    const wrapper = mount(WeatherCard, {
      props: {
        city: mockCity,
        weather: mockWeather,
        isLoading: false
      }
    });

    expect(wrapper.text()).toContain('10 km');
  });
});
