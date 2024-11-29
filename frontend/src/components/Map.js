import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';

// Configurar los iconos predeterminados de Leaflet
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const Map = () => {
  const [civilizations, setCivilizations] = useState([]);
  const [newCivilization, setNewCivilization] = useState({
    name: '',
    description: '',
    latitude: 0,
    longitude: 0,
    image: null, // Aquí almacenaremos la imagen
  });

  // Obtener civilizaciones al cargar el componente
  useEffect(() => {
    fetchCivilizations();
  }, []);

  const fetchCivilizations = async () => {
    try {
      const response = await axios.get('http://localhost:3001/civilizations');
      setCivilizations(response.data);
    } catch (error) {
      console.error('Error fetching civilizations:', error.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCivilization({ ...newCivilization, [name]: value });
  };

  const handleImageChange = (e) => {
    setNewCivilization({ ...newCivilization, image: e.target.files[0] });
  };

  const handleAddCivilization = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', newCivilization.name);
    formData.append('description', newCivilization.description);
    formData.append('latitude', newCivilization.latitude);
    formData.append('longitude', newCivilization.longitude);
    formData.append('image', newCivilization.image);

    try {
      await axios.post('http://localhost:3001/civilizations', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchCivilizations();
    } catch (error) {
      console.error('Error adding civilization:', error.message);
    }
  };

  const createCustomIcon = (imageUrl) => {
    // Asegúrate de construir correctamente la URL completa
    const fullImageUrl = `http://localhost:3001${imageUrl}`;
    console.log('Custom Icon URL:', fullImageUrl); // Log para depurar
  
    return L.icon({
      iconUrl: fullImageUrl, // Asegúrate de que sea la URL completa
      iconSize: [30, 30],    // Tamaño del icono
      iconAnchor: [15, 40],  // Ancla del icono (centro inferior)
    });
  };

  const handleDeleteCivilization = async (id) => {
    try {
      await axios.delete(`http://localhost:3001/civilizations/${id}`);
      setCivilizations(civilizations.filter((civ) => civ.id !== id));
      console.log(`Civilization with id ${id} deleted successfully`);
    } catch (error) {
      console.error('Error deleting civilization:', error.message);
    }
  };
  
  const handleEditCivilization = async (id, updatedData) => {
    const formData = new FormData();
    formData.append('name', updatedData.name);
    formData.append('description', updatedData.description);
    formData.append('latitude', updatedData.latitude);
    formData.append('longitude', updatedData.longitude);
    if (updatedData.image) {
      formData.append('image', updatedData.image);
    }
  
    try {
      await axios.put(`http://localhost:3001/civilizations/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchCivilizations(); // Refrescar la lista
      console.log(`Civilization with id ${id} updated successfully`);
    } catch (error) {
      console.error('Error updating civilization:', error.message);
    }
  };
  

  return (
    <div>
      <h1>Civilizaciones</h1>
      <form onSubmit={handleAddCivilization}>
        <input
          type="text"
          name="name"
          placeholder="Nombre"
          value={newCivilization.name}
          onChange={handleInputChange}
        />
        <textarea
          name="description"
          placeholder="Descripción"
          value={newCivilization.description}
          onChange={handleInputChange}
        />
        <input
          type="number"
          name="latitude"
          placeholder="Latitud"
          value={newCivilization.latitude}
          onChange={handleInputChange}
        />
        <input
          type="number"
          name="longitude"
          placeholder="Longitud"
          value={newCivilization.longitude}
          onChange={handleInputChange}
        />
        <input type="file" name="image" onChange={handleImageChange} />
        <button type="submit">Agregar Civilización</button>
      </form>
      <div style={{ height: '80vh', width: '100%' }}>
        <MapContainer 
          center={[0, 0]} 
          zoom={2} 
          style={{ flex: 1, height: '100%' }}
          maxBounds={[
            [-90, -180], 
            [90, 180], 
          ]}
          maxBoundsViscosity={1.0} 
          minZoom={2} 
          maxZoom={5}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          {civilizations.map((civ) => (
            <Marker
              key={civ.id}
              position={[civ.latitude, civ.longitude]}
              icon={createCustomIcon(civ.image)}
            >
              <Popup>
                <div>
                  <h3>{civ.name}</h3>
                  <p>{civ.description}</p>
                  <img
                    src={`http://localhost:3001${civ.image}`}
                    alt={civ.name}
                    style={{ width: '100px', height: '100px' }}
                  />
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleEditCivilization(civ.id, {
                        name: civ.name,
                        description: civ.description,
                        latitude: civ.latitude,
                        longitude: civ.longitude,
                        image: civ.newImage,
                      });
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Nuevo nombre"
                      defaultValue={civ.name}
                      onChange={(e) => (civ.name = e.target.value)}
                    />
                    <textarea
                      placeholder="Nueva descripción"
                      defaultValue={civ.description}
                      onChange={(e) => (civ.description = e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="Nueva latitud"
                      defaultValue={civ.latitude}
                      onChange={(e) => (civ.latitude = parseFloat(e.target.value))}
                    />
                    <input
                      type="number"
                      placeholder="Nueva longitud"
                      defaultValue={civ.longitude}
                      onChange={(e) => (civ.longitude = parseFloat(e.target.value))}
                    />
                    <input type="file" onChange={(e) => (civ.newImage = e.target.files[0])} />
                    <button type="submit">Guardar Cambios</button>
                  </form>
                  <button onClick={() => handleDeleteCivilization(civ.id)}>Eliminar</button>
                </div>
              </Popup>

            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default Map;
