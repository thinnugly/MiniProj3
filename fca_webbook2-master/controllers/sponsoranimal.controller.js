const SponsorAnimal = require('../models/sponsoranimal.model')
const { validationResult } = require('express-validator');
const SponsorAnimalMessages = require('../messages/sponsoranimal.messages')
const Animal = require('../models/animal.model');
const Sponsor = require('../models/sponsor.model');


exports.get = (req, res) => {
    SponsorAnimal.find(req.query).exec((error, sponsorsanimal) => {
        if (error) throw error;

        let message = SponsorAnimalMessages.success.s2;

        if (sponsorsanimal.length <= 0)
            message = SponsorAnimalMessages.success.s5;

        message.body = sponsorsanimal;
        return res.status(message.http).send(message);
    });
}

exports.create = async (req, res) => {
    const errors = validationResult(req).array();
    if (errors.length > 0) return res.status(406).send(errors);

    try {
        const existingSponsorAnimal = await SponsorAnimal.findOne({
            sponsor_id: req.body.sponsor_id,
            animal_id: req.body.animal_id
        });

        if (existingSponsorAnimal) {
            return res.status(409).send({
                message: "Este patrocinador já está associado a este animal."
            });
        }

        const newSponsorAnimal = new SponsorAnimal({
            sponsor_id: req.body.sponsor_id,
            animal_id: req.body.animal_id,
            notes: req.body.notes
        });

        const sponsoranimal = await newSponsorAnimal.save();
        let message = SponsorAnimalMessages.success.s0;
        message.body = sponsoranimal;

        return res
            .header("location", "/sponsorsanimal/" + sponsoranimal._id)
            .status(message.http)
            .send(message);
    } catch (error) {
        console.error("Erro ao criar associação:", error);
        return res.status(500).send({
            message: "Erro ao criar associação de patrocinador com animal."
        });
    }
};


exports.update = async (req, res) => {
    const errors = validationResult(req).array();
    if (errors.length > 0) return res.status(406).send(errors);

    try {
        const existingSponsorAnimal = await SponsorAnimal.findOne({
            sponsor_id: req.body.sponsor_id,
            animal_id: req.body.animal_id,
            _id: { $ne: req.params.id } 
        });

        if (existingSponsorAnimal) {
            return res.status(409).send({
                message: "Este patrocinador já está associado a este animal."
            });
        }

        SponsorAnimal.findOneAndUpdate({
            _id: req.params.id
        }, {
            $set: req.body
        }, {
            new: true
        }, (error, sponsoranimal) => {
            if (error) throw error;
            if (!sponsoranimal) return res.status(SponsorAnimalMessages.error.e0.http).send(SponsorAnimalMessages.error.e0);

            let message = SponsorAnimalMessages.success.s1;
            message.body = sponsoranimal;
            return res.status(message.http).send(message);
        });
    } catch (error) {
        console.error("Erro ao atualizar associação:", error);
        return res.status(500).send({
            message: "Erro ao atualizar associação de patrocinador com animal."
        });
    }
};


exports.delete = (req, res) => {
    const errors = validationResult(req).array();
    if (errors.length > 0) return res.status(406).send(errors);

    SponsorAnimal.deleteOne({
        _id: req.params.id
    }, (error, result) => {
        if (error) throw error;
        if (result.deletedCount <= 0) return res.status(SponsorAnimalMessages.error.e0.http).send(SponsorAnimalMessages.error.e0);
        return res.status(SponsorAnimalMessages.success.s3.http).send(SponsorAnimalMessages.success.s3);
    });
}

exports.getOne = (req, res) => {
    const errors = validationResult(req).array();
    if (errors.length > 0) return res.status(406).send(errors);

    SponsorAnimal.findOne({
        _id: req.params.id
    }).exec((error, sponsoranimal) => {
        if (error) throw error;
        if (!sponsoranimal) return res.status(SponsorAnimalMessages.error.e0.http).send(SponsorAnimalMessages.error.e0);

        let message = SponsorAnimalMessages.success.s2;
        message.body = sponsoranimal;
        return res.status(message.http).send(message);
    });
}

exports.getSponsorNameBySponsorId = (req, res) => {

    const errors = validationResult(req).array();
    if (errors.length > 0) return res.status(406).send(errors);

    const sponsorId = req.params.id; 

    SponsorAnimal.findOne({ sponsor_id: sponsorId })
        .populate({
            path: 'sponsor_id', 
            select: 'name',  
        })
        .exec((error, sponsorAnimal) => {
            if (error) {
                return res.status(500).send({ message: 'Erro ao buscar patrocinador' });
            }

            if (!sponsorAnimal) {
                return res.status(404).send({ message: 'Patrocinador não encontrado para o ID fornecido.' });
            }

            res.status(200).send({
                sponsorName: sponsorAnimal.sponsor_id.name
            });
        });
};

exports.getAnimalNameByAnimalId = (req, res) => {

    const errors = validationResult(req).array();
    if (errors.length > 0) return res.status(406).send(errors);

    const animalId = req.params.id; 

    SponsorAnimal.findOne({ animal_id: animalId })
        .populate({
            path: 'animal_id', 
            select: 'name',  
        })
        .exec((error, sponsorAnimal) => {
            if (error) {
                return res.status(500).send({ message: 'Erro ao buscar animal' });
            }

            if (!sponsorAnimal) {
                return res.status(404).send({ message: 'Animal não encontrado para o ID fornecido.' });
            }

            res.status(200).send({
                animalName: sponsorAnimal.animal_id.name
            });
        });
};
    
exports.getAnimalsBySponsorId = (req, res) => {
    const errors = validationResult(req).array();
    if (errors.length > 0) return res.status(406).send(errors);

    const sponsorId = req.params.id; 

    SponsorAnimal.find({ sponsor_id: sponsorId })
        .populate({
            path: 'animal_id',
            select: 'name group',
        })
        .exec((error, sponsorAnimals) => {
            if (error) {
                return res.status(500).send({ message: 'Erro ao buscar animais patrocinados' });
            }

            if (!sponsorAnimals || sponsorAnimals.length === 0) {
                return res.status(404).send({ message: 'Nenhum animal patrocinado encontrado para o ID fornecido.' });
            }

            const animals = sponsorAnimals.map(sponsorAnimal => ({
                animalName: sponsorAnimal.animal_id.name,
                species: sponsorAnimal.animal_id.group,
            }));

            res.status(200).send({
                sponsorId: sponsorId,
                animals: animals,
            });
        });
};
  
exports.getSponsorAnimalDetails = async (req, res) => {
  const { sponsorAnimalId } = req.params;

  try {
    const sponsorAnimal = await SponsorAnimal.findById(sponsorAnimalId);
    if (!sponsorAnimal) {
      return res.status(404).json({ message: 'Associação não encontrada.' });
    }

    const sponsor = await Sponsor.findById(sponsorAnimal.sponsor_id);
    if (!sponsor) {
      return res.status(404).json({ message: 'Patrocinador não encontrado.' });
    }

    const animal = await Animal.findById(sponsorAnimal.animal_id);
    if (!animal) {
      return res.status(404).json({ message: 'Animal não encontrado.' });
    }
    
    return res.status(200).json({
      sponsorAnimalId: sponsorAnimal._id,
      sponsorName: sponsor.name,
      animalName: animal.name,
      notes: sponsorAnimal.notes,
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes do patrocinador e animal:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};
  

