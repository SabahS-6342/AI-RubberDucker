import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  SimpleGrid,
  useColorModeValue,
  Button,
  Icon,
  Flex,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  useDisclosure,
} from '@chakra-ui/react';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import config from '../config';

const MaterialForm = ({ material, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    title: material?.title || '',
    description: material?.description || '',
    type: material?.type || 'article',
    difficulty: material?.difficulty || 'Beginner',
    url: material?.url || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={4}>
        <FormControl isRequired>
          <FormLabel>Title</FormLabel>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter title"
          />
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Description</FormLabel>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter description"
          />
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Type</FormLabel>
          <Select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          >
            <option value="article">Article</option>
            <option value="video">Video</option>
            <option value="book">Book</option>
          </Select>
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Difficulty</FormLabel>
          <Select
            value={formData.difficulty}
            onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
          >
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </Select>
        </FormControl>
        <FormControl isRequired>
          <FormLabel>URL</FormLabel>
          <Input
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            placeholder="Enter URL"
          />
        </FormControl>
        <Button type="submit" colorScheme="orange" width="full">
          {material ? 'Update Material' : 'Add Material'}
        </Button>
      </VStack>
    </form>
  );
};

const AdminStudyMaterials = () => {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const fetchMaterials = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/study-materials`);
      if (!response.ok) {
        throw new Error('Failed to fetch study materials');
      }
      const data = await response.json();
      setMaterials(data);
    } catch (err) {
      setError(err.message);
      toast({
        title: 'Error',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleAddMaterial = async (formData) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/admin/study-materials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to add material');
      }

      toast({
        title: 'Success',
        description: 'Material added successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
      fetchMaterials();
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleUpdateMaterial = async (formData) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/admin/study-materials/${selectedMaterial._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update material');
      }

      toast({
        title: 'Success',
        description: 'Material updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
      fetchMaterials();
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      try {
        const response = await fetch(`${config.API_BASE_URL}/api/admin/study-materials/${materialId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete material');
        }

        toast({
          title: 'Success',
          description: 'Material deleted successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        fetchMaterials();
      } catch (err) {
        toast({
          title: 'Error',
          description: err.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  const handleEditClick = (material) => {
    setSelectedMaterial(material);
    onOpen();
  };

  const handleAddClick = () => {
    setSelectedMaterial(null);
    onOpen();
  };

  return (
    <Box minH="100vh" bg={bgColor} py={8}>
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          <Flex justify="space-between" align="center">
            <Box>
              <Heading size="xl" mb={2}>
                Manage Study Materials
              </Heading>
              <Text color="gray.600">
                Add, edit, or remove study materials
              </Text>
            </Box>
            <Button
              leftIcon={<FaPlus />}
              colorScheme="orange"
              onClick={handleAddClick}
            >
              Add Material
            </Button>
          </Flex>

          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Title</Th>
                  <Th>Type</Th>
                  <Th>Difficulty</Th>
                  <Th>URL</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {materials.map((material) => (
                  <Tr key={material._id}>
                    <Td>{material.title}</Td>
                    <Td>{material.type}</Td>
                    <Td>{material.difficulty}</Td>
                    <Td>
                      <Text isTruncated maxW="200px">
                        {material.url}
                      </Text>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <Button
                          size="sm"
                          leftIcon={<FaEdit />}
                          onClick={() => handleEditClick(material)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          colorScheme="red"
                          leftIcon={<FaTrash />}
                          onClick={() => handleDeleteMaterial(material._id)}
                        >
                          Delete
                        </Button>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </VStack>
      </Container>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedMaterial ? 'Edit Material' : 'Add New Material'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <MaterialForm
              material={selectedMaterial}
              onSubmit={selectedMaterial ? handleUpdateMaterial : handleAddMaterial}
              onClose={onClose}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AdminStudyMaterials; 